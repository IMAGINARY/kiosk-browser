mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
COPYFILES   := 
include ../Makefile.inc

CMD=hb_wrapper.sh launch.sh browser.sh
ARGS=
APP_ID=browser_app

# --privileged
RUNTERM=--rm -it -a stdin -a stdout -a stderr --ipc=host --net=host 
OPTS=/sbin/my_init --skip-startup-files --skip-runit

check: $(TS)
	### [ -z "${DISPLAY}" ] && exit 1
	: xhost + || exit 1
	docker ps -a
	ls -al /dev/pts/ptmx 
	: chmod a+rw /dev/pts/ptmx
	docker run -e DISPLAY -e APP_ID="${APP_ID}" ${RUNTERM} --label is_top_app=1 -v /tmp/:/tmp/:rw -v /dev/shm:/dev/shm $(IMG) ${OPTS} -- ${CMD} ${ARGS} || true
	ls -al /dev/pts/ptmx
	: chmod a+rw /dev/pts/ptmx
