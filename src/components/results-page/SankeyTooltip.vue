<template>
	<div v-if="visible" class="tooltip" :style="{ left: `${x}px`, top: `${y}px` }">
		<v-card class="rounded-lg text-white tooltip">
			<v-col>
				<v-row>
					<div>
						<p class="mb-n1" style="font-size: 0.6rem">#{{ data.taxon_id }}</p>
						<v-card-title class="opacity-100 text-subtitle-2 pt-0 pb-0 px-0 font-weight-bold">{{ data.name }}</v-card-title>
					</div>
					<v-chip variant="tonal" color="orange-lighten-1 px-2 font-weight-bold" density="compact">{{ data.rankDisplayName }}</v-chip>
				</v-row>

				<v-row>
					<v-divider class="my-2"></v-divider>
				</v-row>

				<v-row>
					<v-card-subtitle>Proportion</v-card-subtitle>
					<v-card-text>{{ data.proportion }}%</v-card-text>
				</v-row>

				<v-row>
					<v-card-subtitle>Clade Reads</v-card-subtitle>
					<v-card-text>{{ data.clade_reads }}</v-card-text>
				</v-row>

				<v-row>
					<v-card-subtitle>Taxon Reads</v-card-subtitle>
					<v-card-text>{{ data.taxon_reads }}</v-card-text>
				</v-row>
			</v-col>
		</v-card>
	</div>
</template>

<script>
export default {
	name: "SankeyTooltip",
	props: {
		data: {
			type: Object,
			required: true,
		},
		visible: {
			type: Boolean,
			required: true,
		},
		x: {
			type: Number,
			required: true,
		},
		y: {
			type: Number,
			required: true,
		},
	},
};
</script>

<style scoped>
.tooltip {
	position: fixed;
	background-color: rgba(38, 50, 56, 0.95);
	pointer-events: none;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.tooltip .v-card {
	padding-right: 16px;
	padding-left: 16px;
	padding-top: 10px;
	padding-bottom: 8px;
}
.tooltip .v-row {
	display: flex;
	align-content: center;
	align-items: center;
	justify-content: space-between;
	column-gap: 16px;
}
.tooltip .v-card-title {
	max-width: 200px;
	word-wrap: break-word;
	white-space: normal; /* Ensure text wraps */
}
.tooltip .v-card-subtitle {
	padding-left: 0px;
}
.tooltip .v-card-text {
	padding-top: 4px;
	padding-bottom: 4px;
	padding-right: 0px;
	padding-left: 0px;
	text-align: end;
}
</style>
