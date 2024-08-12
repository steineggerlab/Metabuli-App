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

win: resources/win/x64/${FRONTEND_APP}.bat 
mac: resources/mac/x64/${FRONTEND_APP} resources/mac/arm64/${FRONTEND_APP} 
linux: resources/linux/arm64/${FRONTEND_APP} resources/linux/x64/${FRONTEND_APP}

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

resources/win/x64/${FRONTEND_APP}.bat:
	mkdir -p resources/win/x64
	cd resources/win/x64 && wget -nv -O ${FRONTEND_APP}-win64.zip https://mmseqs.com/metabuli/metabuli-win64.zip \
		&& unzip ${FRONTEND_APP}-win64.zip && mv ${FRONTEND_APP}/* . && rmdir ${FRONTEND_APP} && rm ${FRONTEND_APP}-win64.zip
	chmod -R +x resources/win/x64/${FRONTEND_APP}.bat resources/win/x64/bin/*

clean:
	@rm -rf resources/mac/* resources/linux/* resources/win/* 