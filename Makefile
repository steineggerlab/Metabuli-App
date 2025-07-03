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
mac: resources/mac/${FRONTEND_APP} resources/mac/fastp resources/mac/fastplong
linux: resources/linux/arm64/${FRONTEND_APP} resources/linux/x64/${FRONTEND_APP} resources/linux/x64/fastp

# macOS
resources/mac/${FRONTEND_APP}:
	mkdir -p resources/mac
	wget -nv -q -O - https://mmseqs.com/metabuli/metabuli-osx-universal.tar.gz | tar -xOf - ${FRONTEND_APP}/bin/${FRONTEND_APP} > resources/mac/${FRONTEND_APP}
	chmod +x resources/mac/${FRONTEND_APP}

resources/mac/fastp:
	mkdir -p resources/mac
	wget -nv -q -O - https://github.com/jaebeom-kim/fastp/releases/download/v0.0.1/fastp-osx-universal.gz | gunzip > resources/mac/fastp
	chmod +x resources/mac/fastp

resources/mac/fastplong:
	mkdir -p resources/mac
	wget -nv -q -O - https://github.com/jaebeom-kim/fastplong/releases/download/v0.0.1/fastplong-osx-universal.gz | gunzip > resources/mac/fastplong
	chmod +x resources/mac/fastplong


# Windows
resources/win/x64/${FRONTEND_APP}.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O ${FRONTEND_APP}-win64.zip https://mmseqs.com/metabuli/metabuli-win64.zip \
		&& unzip ${FRONTEND_APP}-win64.zip && mv ${FRONTEND_APP}/* . && rmdir ${FRONTEND_APP} && rm ${FRONTEND_APP}-win64.zip
	chmod -R +x resources/win/x64/${FRONTEND_APP}.bat resources/win/x64/bin/*

resources/win/x64/fastp.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O fastp-windows.zip https://github.com/jaebeom-kim/fastp/releases/download/v0.0.1/fastp-windows.zip \
		&& unzip fastp-windows.zip && cp -r fastp/* . && rm -rf fastp && rm fastp-windows.zip
	chmod -R +x resources/win/x64/fastp.bat resources/win/x64/bin/*

resources/win/x64/fastplong.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O fastplong-windows.zip https://github.com/jaebeom-kim/fastplong/releases/download/v0.0.1/fastplong-windows.zip \
		&& unzip fastplong-windows.zip && cp -r fastplong/* . && rm -rf fastplong && rm fastplong-windows.zip
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

resources/linux/arm64/${FRONTEND_APP}:
	mkdir -p resources/linux/arm64
	wget -nv -q -O - https://mmseqs.com/metabuli/metabuli-linux-arm64.tar.gz | tar -xOf - ${FRONTEND_APP}/bin/${FRONTEND_APP} > resources/linux/arm64/${FRONTEND_APP}
	chmod +x resources/linux/arm64/${FRONTEND_APP}

resources/linux/x64/fastp:
	mkdir -p resources/linux/x64
	wget http://opengene.org/fastp/fastp && mv fastp resources/linux/x64/fastp && chmod a+x resources/linux/x64/fastp


clean:
	@rm -rf resources/mac/* resources/linux/* resources/win/*
