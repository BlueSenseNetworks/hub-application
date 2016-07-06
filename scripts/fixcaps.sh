#!/bin/bash

GETCAP='/sbin/getcap'
SETCAP='/sbin/setcap'

CAP_ADMIN='cap_net_admin'
CAP_RAW='cap_net_raw'
CAP_ADMIN_RAW="$CAP_ADMIN,$CAP_RAW"

HCI_BIN='/home/bsn/node-hub/node_modules/noble/build/Release/hci-ble'
L2CAP_BIN='/home/bsn/node-hub/node_modules/noble/build/Release/l2cap-ble'
HCICONFIG_BIN='/usr/bin/hciconfig'
HCITOOL_BIN='/usr/bin/hcitool'
HCIDUMP_BIN='/usr/sbin/hcidump'

fixcaps() {
  CAPS=`$GETCAP $1`
  if [ -z "$CAPS" ]; then
     SETCAPS_CMD="$SETCAP $2=eip $1"
     $SETCAPS_CMD
  fi
}

fixcaps $HCICONFIG_BIN $CAP_ADMIN
fixcaps $HCITOOL_BIN $CAP_RAW
fixcaps $HCIDUMP_BIN $CAP_RAW
fixcaps $HCI_BIN $CAP_ADMIN_RAW
fixcaps $L2CAP_BIN $CAP_ADMIN_RAW

