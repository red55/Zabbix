ZBX-WINDOWS-MSSQL
=================

This template use Zabbix agent to discover and manage SQL server. Support for multiply SQL instances.No SQL2000 support yet. Tested on SQL 2012 and SQL 2008. Should work with SQL 2005 also.

Items
-----

  * MSSQL server edition
  * MSSQL server product
  * MSSQL server version
  * MSSQL maximum DB size
  * Connection memory
  * Granted workspace memory
  * Lock blocks
  * Lock blocks allocated
  * Lock memory
  * Lock owner blocks
  * Lock owner blocks allocated
  * Maximum workspace memory
  * Memory grants outstanding
  * Memory grants pending
  * Optimizer memory
  * SQL cache memory
  * Target server memory
  * Total server memory
  * Discovery: Data file(s) size for each database
  * Discovery: Log file(s) size for each database
  * Discovery: Log file(s) used size for each database
  * Discovery: Percent log used for each database
  * Discovery: Log cache reads/sec for each database
  * Discovery: Transactions/sec for each database

Triggers
--------

  * **[HIGH]** => Discovery : database exceed 90% of the maximum DB size for each database
  * **[AVERAGE]** => Discovery : database exceed 80% of the maximum DB size for each database
  * **[WARNING]** => Discovery : database exceed 80% of the maximum DB size for each database
  * **[INFORMATION]** => MSSQL server version was changed

Graphs
------

  * MSSQL server memory

Installation
------------

1. Install the Zabbix agent on your host or download my automated package [`Zabbix agent`](https://github.com/jjmartres/Zabbix/tree/master/zbx-agent)
2. Install [`zabbix_mssql_discovery.js`](https://github.com/red55/Zabbix/blob/master/zbx-templates/zbx-windows/zbx-windows-mssql/zabbix_mssql_discovery.js) in the script directory of your Zabbix agent
3. Add the following line to your Zabbix agent configuration file. Note that `<zabbix_script_path>` is your Zabbix agent script path :

		EnableRemoteCommands=1
		UnsafeUserParameters=1
		UserParameter = system.discovery[*],%systemroot%\system32\cscript.exe /nologo /T:30 "<zabbix_script_path>\zabbix_mssql_discovery.js" "$1"
		UserParameter = mssql.version[*],%systemroot%\system32\cscript.exe /nologo /T:30  "<zabbix_script_path>\zabbix_mssql_discovery.js"

5. Import **zbx-windows-mssql.xml** file into Zabbix.
6. Associate **ZBX-WINDOWS-MSSQL** template to the host.

### Requirements

This template was tested for Zabbix 2.0.0 and higher.

##### [Zabbix agent](http://www.zabbix.com) 2.0.x
##### [`zabbix_mssql_discovery.js`](https://github.com/red55/Zabbix/blob/master/zbx-templates/zbx-windows/zbx-windows-mssql/zabbix_mssql_discovery.js) 1.0

License
-------

This template is distributed under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the  License, or (at your option) any later version.

### Copyright

  Copyright (c) Jean-Jacques Martrès

### Authors

  Jean-Jacques Martrès
  (jjmartres |at| gmail |dot| com)
