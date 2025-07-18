.PHONY: all clean

FRONTEND_APP := metabuli
metabulilink := https://mmseqs.com/metabuli/

all: mac linux win
ifneq ($(shell uname -s),Darwin)
# llvm-lipo is part of llvm since release 14
LIPO ?= llvm-lipo
else
LIPO ?= lipo
endif

win: resources/win/x64/${FRONTEND_APP}.bat resources/win/x64/fastp.bat resources/win/x64/fastplong.bat
mac: resources/mac/x64/${FRONTEND_APP} resources/mac/arm64/${FRONTEND_APP}  resources/mac/x64/fastp resources/mac/arm64/fastp resources/mac/x64/fastplong resources/mac/arm64/fastplong
linux: resources/linux/x64/${FRONTEND_APP} resources/linux/x64/fastp resources/linux/x64/fastplong

# macOS
## Architecture-specific rules for macOS metabuli
resources/mac/${FRONTEND_APP}:
	mkdir -p resources/mac
	wget -nv -q -O - https://mmseqs.com/metabuli/metabuli-osx-universal.tar.gz | tar -xOf - ${FRONTEND_APP}/bin/${FRONTEND_APP} > resources/mac/${FRONTEND_APP}
	chmod +x resources/mac/${FRONTEND_APP}

resources/mac/x64/${FRONTEND_APP}: resources/mac/${FRONTEND_APP}
	mkdir -p resources/mac/x64
	$(LIPO) resources/mac/${FRONTEND_APP} -remove arm64 -output resources/mac/x64/${FRONTEND_APP} || cp -f -- resources/mac/${FRONTEND_APP} resources/mac/x64/${FRONTEND_APP}

resources/mac/arm64/${FRONTEND_APP}: resources/mac/${FRONTEND_APP}
	mkdir -p resources/mac/arm64
	$(LIPO) resources/mac/${FRONTEND_APP} -thin arm64 -output resources/mac/arm64/${FRONTEND_APP} || cp -f -- resources/mac/${FRONTEND_APP} resources/mac/arm64/${FRONTEND_APP}

# Architecture-specific rules for macOS fastp
resources/mac/fastp:
	mkdir -p resources/mac
	wget -nv -q -O - https://github.com/jaebeom-kim/fastp/releases/download/v0.0.2/fastp-osx-universal.gz | gunzip > resources/mac/fastp
	chmod +x resources/mac/fastp

resources/mac/x64/fastp: resources/mac/fastp
	mkdir -p resources/mac/x64
	$(LIPO) resources/mac/fastp -remove arm64 -output resources/mac/x64/fastp || cp -f -- resources/mac/fastp resources/mac/x64/fastp

resources/mac/arm64/fastp: resources/mac/fastp
	mkdir -p resources/mac/arm64
	$(LIPO) resources/mac/fastp -thin arm64 -output resources/mac/arm64/fastp || cp -f -- resources/mac/fastp resources/mac/arm64/fastp

# Architecture-specific rules for macOS fastplong
resources/mac/fastplong:
	mkdir -p resources/mac
	wget -nv -q -O - https://github.com/jaebeom-kim/fastplong/releases/download/v0.0.3/fastplong-osx-universal.gz | gunzip > resources/mac/fastplong
	chmod +x resources/mac/fastplong

resources/mac/x64/fastplong: resources/mac/fastplong
	mkdir -p resources/mac/x64
	$(LIPO) resources/mac/fastplong -remove arm64 -output resources/mac/x64/fastplong || cp -f -- resources/mac/fastplong resources/mac/x64/fastplong

resources/mac/arm64/fastplong: resources/mac/fastplong
	mkdir -p resources/mac/arm64
	$(LIPO) resources/mac/fastplong -thin arm64 -output resources/mac/arm64/fastplong || cp -f -- resources/mac/fastplong resources/mac/arm64/fastplong


# Windows
resources/win/x64/${FRONTEND_APP}.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O ${FRONTEND_APP}-win64.zip https://mmseqs.com/metabuli/metabuli-win64.zip \
		&& unzip ${FRONTEND_APP}-win64.zip && mv ${FRONTEND_APP}/* . && rmdir ${FRONTEND_APP} && rm ${FRONTEND_APP}-win64.zip
	chmod -R +x resources/win/x64/${FRONTEND_APP}.bat resources/win/x64/bin/*

resources/win/x64/fastp.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O fastp-windows.zip https://github.com/jaebeom-kim/fastp/releases/download/v0.0.2/fastp-windows.zip \
		&& unzip fastp-windows.zip && cp -r fastp/* . && rm -rf fastp && rm fastp-windows.zip
	chmod -R +x resources/win/x64/fastp.bat resources/win/x64/bin/*

resources/win/x64/fastplong.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O fastplong-windows.zip https://github.com/jaebeom-kim/fastplong/releases/download/v0.0.3/fastplong-windows.zip \
		&& unzip fastplong-windows.zip && rm fastplong-windows.zip
	chmod -R +x resources/win/x64/fastplong.bat resources/win/x64/bin/*


# Linux
resources/linux/x64/${FRONTEND_APP}-sse2:
	mkdir -p resources/linux/x64
	wget -nv -q -O - https://mmseqs.com/metabuli/metabuli-linux-sse2.tar.gz | tar -xOf - ${FRONTEND_APP}/bin/${FRONTEND_APP} > resources/linux/x64/${FRONTEND_APP}-sse2
	chmod +x resources/linux/x64/${FRONTEND_APP}-sse2

resources/linux/x64/${FRONTEND_APP}-avx2:
	mkdir -p resources/linux/x64
	wget -nv -q -O - https://mmseqs.com/metabuli/metabuli-linux-avx2.tar.gz | tar -xOf - ${FRONTEND_APP}/bin/${FRONTEND_APP} > resources/linux/x64/${FRONTEND_APP}-avx2
	chmod +x resources/linux/x64/${FRONTEND_APP}-avx2

resources/linux/x64/${FRONTEND_APP}: ./${FRONTEND_APP}-wrapper.sh resources/linux/x64/${FRONTEND_APP}-avx2 resources/linux/x64/${FRONTEND_APP}-sse2
	cp ./${FRONTEND_APP}-wrapper.sh resources/linux/x64/${FRONTEND_APP}
	chmod +x resources/linux/x64/${FRONTEND_APP}

resources/linux/x64/fastp:
	mkdir -p resources/linux/x64
	wget http://opengene.org/fastp/fastp && mv fastp resources/linux/x64/fastp && chmod a+x resources/linux/x64/fastp

resources/linux/x64/fastplong:
	mkdir -p resources/linux/x64
	wget http://opengene.org/fastplong/fastplong && mv fastplong resources/linux/x64/fastplong && chmod a+x resources/linux/x64/fastplong


clean:
	@rm -rf resources/mac/* resources/linux/* resources/win/*
