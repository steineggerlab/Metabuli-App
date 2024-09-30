<template>
	<v-data-table :headers="headers" :items="filteredTableResults" height="550px" density="comfortable" items-per-page="20" multi-sort sticky>
		<template v-slot:top>
			<div class="d-flex align-center">
				<!-- NUMBER OF DATA ITEMS -->
				<div>Showing {{ totalItems }} entries</div>

				<v-spacer></v-spacer>

				<!-- SEARCH BAR -->
				<v-text-field v-model="searchQuery" prepend-inner-icon="$magnify" density="compact" label="Search results" variant="outlined" rounded="lg" single-line color="indigo" clearable></v-text-field>
			</div>
		</template>

		<template v-slot:[`header.rank`]>
			<div class="d-flex align-center justify-space-between">
				<span>Rank</span>
				<v-menu v-model="rankMenu" width="250" transition="scale-transition" :close-on-content-click="false" location="bottom end" @click:outside="closeMenu">
					<template v-slot:activator="{ props }">
						<v-btn :variant="rankFilterVariant" :color="rankFilterColor" icon size="small" density="comfortable" v-bind="props">
							<v-icon icon="$filterVariant"></v-icon>
						</v-btn>
					</template>

					<v-select
						v-model="filters.rank"
						:items="rankOrderFull"
						variant="outlined"
						label="Filter by Rank"
						multiple
						density="compact"
						clearable
						color="indigo"
						style="background-color: white"
						@blur="closeMenu"
					>
						<template v-slot:selection="{ item, index }">
							<v-chip v-if="index < 2" color="indigo">
								<span>{{ item.title }}</span>
							</v-chip>
							<span v-if="index === 2" class="text-grey text-caption align-self-center"> (+{{ filters.rank.length - 2 }} others) </span>
						</template>
					</v-select>
				</v-menu>
			</div>
		</template>

		<template v-slot:item="{ item }">
			<tr class="table-row">
				<!-- PROPORTION -->
				<td>
					<div class="proportion-cell">
						<div class="proportion-fill" :style="{ width: `${item.proportion}%` }"></div>
						<span class="proportion-text">{{ item.proportion }}%</span>
					</div>
				</td>

				<!-- CLADE READS -->
				<td>
					<div class="clade-reads-cell">
						<div class="clade-reads-fill" :style="{ width: `${(item.clade_reads / maxCladeReads) * 100}%` }"></div>
						<span class="clade-reads-text">{{ item.clade_reads }}</span>
					</div>
				</td>

				<!-- TAXON READS -->
				<td>
					<div class="taxon-reads-cell">
						<div class="taxon-reads-fill" :style="{ width: `${(item.taxon_reads / maxCladeReads) * 100}%` }"></div>
						<span class="taxon-reads-text">{{ item.taxon_reads }}</span>
					</div>
				</td>

				<!-- RANK -->
				<td>
					<v-chip :color="getRankColor(item.rank)" variant="outlined" density="comfortable" rounded="xl">{{ item.rank }}</v-chip>
				</td>

				<!-- TAXON ID -->
				<td>{{ item.taxon_id }}</td>

				<!-- NAME -->
				<td>{{ item.name }}</td>

				<!-- ACTION BUTTONS -->
				<td>
					<!-- VIEW DETAILS BUTTON -->
					<div class="d-flex gc-2 justify-end">
						<v-btn
							text="Details"
							prepend-icon="$eye"
							variant="tonal"
							color="primary"
							size="small"
							class="text-body-2"
							v-if="sankeyRankColumns.includes(item.rank)"
							@click="$emit('row-click', item)"
						/>
						<!-- EXTRACT READS BUTTON -->
						<ExtractReadsDialog :taxonId="item.taxon_id" :menuLocation="'top center'">
							<template v-slot:activator="{ props }">
								<v-btn v-bind="props" text="Extract" prepend-icon="$fileExport" variant="tonal" color="secondary" size="small" class="text-body-2"/>
							</template>
						</ExtractReadsDialog>
					</div>
				</td>
			</tr>
		</template>
	</v-data-table>
</template>

<script>
import { rankOrderFull, sankeyRankColumns, getRankColor } from "@/plugins/rankUtils";
import ExtractReadsDialog from "./ExtractReadsDialog.vue";

export default {
	components: {
		ExtractReadsDialog,
	},

	data() {
		return {
			headers: [
				{
					title: "Proportion (%)",
					align: "center",
					key: "proportion",
					width: "160px",
				},
				{
					title: "Clade Reads",
					align: "center",
					key: "clade_reads",
					width: "140px",
				},
				{
					title: "Taxon Reads",
					align: "center",
					key: "taxon_reads",
					width: "140px",
				},
				{
					title: "Rank",
					align: "start",
					key: "rank",
					width: "140px",
					sortable: false,
					// sortRaw: (a, b) => this.rankSort(a.rank, b.rank),
				},
				{ title: "Taxon ID", align: "start", key: "taxon_id", width: "140px" },
				{ title: "Name", align: "start", key: "name" },
				{ title: "", align: "center", key: "actions" },
			],
			rankMenu: false, // State for controlling visibility of rank filter dropdown
			filters: {
				proportion: null,
				clade_reads: null,
				taxon_reads: null,
				rank: null,
				taxon_id: "",
				name: "",
			},
			searchQuery: "",

			// Imported from rankUtils
			rankOrderFull,
			sankeyRankColumns,
		};
	},
	props: {
		data: Array,
	},
	computed: {
		filteredTableResults() {
			return this.data.filter((item) => {
				const matchesProportion = this.filters.proportion === null || item.proportion >= this.filters.proportion;
				const matchesCladeReads = this.filters.clade_reads === null || item.clade_reads >= this.filters.clade_reads;
				const matchesTaxonReads = this.filters.taxon_reads === null || item.taxon_reads >= this.filters.taxon_reads;
				const matchesRank = this.filters.rank === null || this.filters.rank.length === 0 || this.filters.rank.includes(item.rank);
				const matchesTaxonId = item.taxon_id.toString().toLowerCase().includes(this.filters.taxon_id.toLowerCase());
				const matchesName = item.name.toString().toLowerCase().includes(this.filters.name.toLowerCase());
				const matchesQuery = this.searchQuery ? Object.values(item).some((value) => value.toString().toLowerCase().includes(this.searchQuery.toLowerCase())) : true;

				return matchesProportion && matchesCladeReads && matchesTaxonReads && matchesRank && matchesTaxonId && matchesName && matchesQuery;
			});
		},
		rankFilterVariant() {
			return this.filters.rank && this.filters.rank.length > 0 ? "tonal" : "text";
		},
		rankFilterColor() {
			return this.filters.rank && this.filters.rank.length > 0 ? "indigo" : "black";
		},
		// filteredTableResults() {
		//   return this.data.filter((item) => {
		//     return Object.values(item).some((value) =>
		//       value
		//         .toString()
		//         .toLowerCase()
		//         .includes(this.searchQuery.toLowerCase())
		//     );
		//   });
		// },
		totalItems() {
			return this.filteredTableResults.length;
		},
		maxCladeReads() {
			return Math.max(...this.data.map((item) => item.clade_reads));
		},
	},
	methods: {
		getRankColor, // Imported from colorUtils
		rankSort(a, b) {
			const rankA = this.rankOrderFull.indexOf(a);
			const rankB = this.rankOrderFull.indexOf(b);

			if (rankA < rankB) {
				return 1;
			} else if (rankA > rankB) {
				return -1;
			} else {
				return 0;
			}
		},
		closeMenu() {
			this.rankMenu = false;
		},
	},
};
</script>

<style scoped>
/* Hover effect for table row */
.table-row {
	cursor: pointer;
	transition: background-color 0.2s ease-in-out;
}
.table-row:hover {
	background-color: #f5f8fc;
}
/* Proportional cell background fill */
.proportion-cell,
.clade-reads-cell,
.taxon-reads-cell {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	display: flex;
	justify-content: flex-end;
	align-items: center;
}
.proportion-fill,
.clade-reads-fill,
.taxon-reads-fill {
	position: absolute;
	height: 100%;
	background-color: #b9d4ed;
}
.proportion-text,
.clade-reads-text,
.taxon-reads-text {
	position: relative;
	padding: 8px;
}

/* Alternating row background */
.grey-background {
	background-color: #fafafa;
}
.white-background {
	background-color: #ffffff;
}
</style>
