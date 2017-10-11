mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
COPYFILES   := 
include ../Makefile.inc

CMD=hb_wrapper.sh launch.sh testapp.sh
ARGS=
APP_ID=browser_app

#APP=kiosktest
# IMG  = ${U}/${APP}:${IMAGE_VERSION}
# TAG=titan.h-its.org:5555/${IMG}
# titan.h-its.org:5555/hits/moon:${IMAGE_VERSION:-latest}


# --privileged
RUNTERM=--rm -it -a stdin -a stdout -a stderr --ipc=host --net=host 
OPTS=/sbin/my_init --skip-startup-files --skip-runit

#! 
build: build_full

check: $(TS)
	### [ -z "${DISPLAY}" ] && exit 1
	###: xhost + || exit 1
	xhost "+si:localuser:${USER}" || exit 1
	xhost +si:localuser:root || exit 1
	docker ps -a
	ls -al /dev/pts/ptmx 
	: chmod a+rw /dev/pts/ptmx
	docker run -e DISPLAY -e APP_ID="${APP_ID}" ${RUNTERM} --label is_top_app=1 -v /tmp/:/tmp/:rw -v /dev/shm:/dev/shm $(IMG) ${OPTS} -- ${CMD} ${ARGS} || true
	ls -al /dev/pts/ptmx
	xhost -si:localuser:root || exit 1
	xhost "-si:localuser:${USER}" || exit 1
	: chmod a+rw /dev/pts/ptmx
