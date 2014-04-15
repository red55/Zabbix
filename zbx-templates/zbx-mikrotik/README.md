ZBX-MIKROTIK-BGP
===========

This template use the [mikrotik.bgp.sh](https://github.com/red55/Zabbix/blob/master/zbx-scripts/mikrotik.bgp/mikrotik.bgp.sh) to discover and manage BGP peers in Mikrotik router.

Discover
-----

  * #PEER 
  
Items
-----
  * BGP peer {#PEER} Status
  

Triggers
--------

  * ***[HIGH]*** => BGP Peer #PEER Connection is DOWN. Will fire when connection state != ESTABLISHED
 
Installation
------------

1. Create user zabbix (for example) in Mikrotik router and give him R/O access. 
2. Generate DSA key pair.
3. Import DSA public key in RouterOS.
4. Associate improted key pair with the user.
5. Install [`mikrotik.bgp.sh`](https://github.com/red55/Zabbix/blob/master/zbx-scripts/mikrotik.bgp/mikrotik.bgp.sh) into ExternalScripts directory.
6. Modify `/etc/passwd` to change zabbix' home dir to `/home/zabbix` for example.
6. Put generated DSA key pair into `/home/zabbix/.ssh` on Zabbix server itself or proxy.
7. Run `su -c 'ssh -i /home/zabbix/.ssh/zabbix_dsa zabbix@<routerip>' -s /bin/sh zabbix` and say "yes" to store Router's public key
8. Import [ZBX-MIKROTIK-BGP.xml](https://github.com/red55/Zabbix/blob/master/zbx-templates/zbx-mikrotik/ZBX-MIKROTIK-BGP.xml)
9. Modify template's or host's (`{$ZBX_MKT_BGP_USER}`], [`{$ZBX_MKT_BGP_USER_IDDSA}`) macros to point it to created user and location of DSA key pair.
10. Assosiate `ZBX-MIKROTIK-BGP` with the host.
11. Enjoy

License
-------

This template is distributed under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the  License, or (at your option) any later version.

### Copyright

  Copyright (c) 2014 Leonid Korokh

### Authors
  
  Leonid Korokh
  (lkorokh |at| gmail |dot| com)
  
