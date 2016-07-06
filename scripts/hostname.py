#!/usr/bin/python

import re
from subprocess import call

hostNameFilePath = '/etc/hostname'
hostsFilePath = '/etc/hosts'
currentHostName = file(hostNameFilePath).read().strip()
regex = re.compile("^((?:\d{1,3}\.){3}\d{1,3})(\s+)(" + currentHostName + ")$", re.MULTILINE)

serial = file('/proc/cpuinfo').read().split('Serial')[1].strip()[-8:]  # Get last 8 characters of the serial
newHostName = 'bsn-'+serial

if newHostName != currentHostName:
   # Change hostname in /etc/hostname
   file(hostNameFilePath, 'w').write(newHostName + '\n')

   # Replace hostname in /etc/hosts
   hostsFile = file(hostsFilePath).read()
   hostsFile = (re.sub(regex, r"\1\2" + newHostName, hostsFile))
   file(hostsFilePath, 'w').write(hostsFile)

   # Sync changes to SD Card and reboot
   call('/bin/sync')
   call('/sbin/reboot')
