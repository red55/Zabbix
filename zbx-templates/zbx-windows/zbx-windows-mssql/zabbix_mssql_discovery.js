'using strict';

var VER_SQL2000 ="80";
var VER_SQL2005 = "90";
var VER_SQL2008 = "100";
var VER_SQL2008R2 = "105";
var VER_SQL2012 = "110";
var WMI_CIMV2 = "winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2";
var WMI_SQLSERVER = 'winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\Microsoft\\SqlServer\\';
var WMI_SQLSERVER_2000 = "winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\MicrosoftSQLServer"
var SQL_DEFAULT_INSTANCE = "MSSQLSERVER";

var Exception = function (m, c) 
{
    this.message = arguments[0];
    this.Code = isNaN(arguments[1]) ? -1 : arguments[1];        
      
    return this;
}

var __ComputerName = null;
function GetComputerName()
{
    if (null == __ComputerName)
    {
        var net = new ActiveXObject('WScript.Network');
        __ComputerName = net.computerName;
    }

    return __ComputerName;
}

var __wmiCache = [];
function WMIRoot (root)
{
    var wroot = __wmiCache [root];                                
    if (typeof wroot == 'undefined')
    {
        wroot = __wmiCache [root] = GetObject(root);
    }

    return wroot;
}

function WMIExec(root, q)
{
    var wroot = WMIRoot(root);
       
    return new Enumerator(wroot.ExecQuery(q));
}

var SQLServerInstance = function (n, p)
{   
    var m = p.match(/^\"(.*)\"/);
    
    this._instanceName = n;
    this._instanceNameForPerfCnts = ((n == SQL_DEFAULT_INSTANCE) ? "SQLServer" : n);
    this.Path = null
    if (null == m)
    {
        this.Path = p.split(" ")[0];
    }
    else
    {
        this.Path = m[1];
    }
    

    this._verN = null;
    this._fullVersion = null;

    function ReadVersion(this_)
    {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var v = fso.GetFileVersion(this_.Path);
        this_._verN = v.match(/^\d\d\d\d\.(\d*)/)[1];
        this_._fullVersion = v;        
    }

    this.GetSQLServerWMIPath = function()
    {
        var wmiPath = "ComputerManagement";
        switch (this.Version())
        {
            case VER_SQL2008:
            case VER_SQL2008R2:
                wmiPath = "ComputerManagement10"
                break;
            default://110, 115?
                wmiPath = "ComputerManagement11"
                break;
        }

        return wmiPath;
    }
    this.Version = function ()
    {
        if (null == this._verN)
        {
            ReadVersion(this);
        }
        return this._verN;        
    };

    this.FullVersion = function ()
    {
        if (null == this._fullVersion)
        {
            ReadVersion(this);
            return this._fullVersion;
        }
    }

    this.InstanceName = function ()
    {
        return this._instanceName;
    };
    this.InstanceNameForPerfCnts = function ()
    {
        return this._instanceNameForPerfCnts;
    }
    this.Name = function ()
    {
        switch (this.Version())
        {
            case VER_SQL2012: return "Microsoft SQL Server 2012"; break;
            case VER_SQL2008: return  "Microsoft SQL Server 2008"; break;
            case VER_SQL2008R2: return "Microsoft SQL Server 2008 R2"; break;
            case VER_SQL2005: return "Microsoft SQL Server 2005"; break;
            case VER_SQL2000 : return "Microsoft SQL Server 2000"; break;
            default   :  return "Microsoft SQL Server " + this.Version(); break;
        }
    }

    this.IsDefaultInstance = function ()
    {
        return this.InstanceName () == SQL_DEFAULT_INSTANCE ? true : false;
    }
    this.InstanceSuffix = function ()
    {
        var n = this.InstanceName();
        return this.IsDefaultInstance() ? "" : n.substring(n.indexOf("$") + 1, n.length);
    }

    this._edt = null;
    this.Edition = function ()
    {
        if (null == this._edt)
        {
            if (VER_SQL2000 == this.Version())
            {                

                var v = WMIRoot(WMI_SQLSERVER_2000 + ":MSSQL_SQLServer.Name='" + (this.IsDefaultInstance() ? "(LOCAL)" : GetComputerName() + "\\" + this.InstanceSuffix()) + "'");
                

                var m = v.VersionString.match (/^(.*Edition.*)$/gm);

                if (null == m)
                {
                    throw new Exception ("Can not query for SKUNAME");
                }

                this._edt = m[0].replace("\t", "");
            }
            else
            {
                var q = WMIExec(WMI_SQLSERVER + this.GetSQLServerWMIPath(), "Select * from SqlServiceAdvancedProperty Where PropertyIndex = 10 and SQLServiceType = 1 And ServiceName='" + this.InstanceName() + "'");
                
                if (q.atEnd()) { throw new Exception("Can not query for SKUNAME"); }

                for (; !q.atEnd() ; q.moveNext())
                {
                    var i = q.item();
                    
                    if ("SKUNAME" == i.PropertyName)
                    {
                        this._edt = i.PropertyStrValue;
                        break;
                    }
                }
            }
        }
        return this._edt;
    }

    this.FullName = function ()
    {
        return this.Name() + ", " + this.Edition();
    }

    this.DbMax = function ()
    {
        switch (this.Version())
        {
            case VER_SQL2005:
            case VER_SQL2000:
                if (this.Edition().search("Express") > -1)
                {
                    return '4294967296';//4GB
                }
                break;
            case VER_SQL2008:
            case VER_SQL2008R2:
            case VER_SQL2012:
                if (this.Edition().search("Express") > -1)
                {
                    return '10737418240'; //10GB
                }
                break;
            default:
                return '0';//524PB
        }
        return '589971551185534976';
    }

    this._dbs = null;
    this.Databases = function ()
    {
        if (null == this._dbs)
        {
            this._dbs = [];
            if (VER_SQL2000 == this.Version())
            {
                var e = WMIExec(WMI_SQLSERVER_2000, "Select Name from MSSQL_Database Where SQLServerName like '%"+ 
                    (this.IsDefaultInstance() ? "(LOCAL)" : this.InstanceSuffix()) + "%'");

                while (!e.atEnd())
                {
                    this._dbs.push(e.item().Name);
                    e.moveNext();
                }
            }
            else
            {
                 var q = WMIExec(WMI_CIMV2, "select * from meta_class where __CLASS Like 'Win32_PerfFormattedData_" + this.InstanceName().replace("\$", '') + "%Databases%'")

                for (; !q.atEnd() ; q.moveNext())
                {
                    var qq = WMIExec(WMI_CIMV2, "select * from " + q.item().Path_.Class);

                    for (; !qq.atEnd() ; qq.moveNext())
                    {
                        var j = qq.item();
                        if ("_Total" == j.Name)
                        {
                            continue
                        };
                        this._dbs.push(j.Name);
                    }
                }
            }
        }

        return this._dbs;
    }

    return this;
}

/*
 {
 "data": [
        {
            "{#SQLINST}": "MSSQLSERVER",
            "{#DBNAME}": "master"
            
        },
    ]
}
*/
function DiscoverDatabases(instances_)
{
    var hd = '{\n\n"data":[\n'
    for (var i = 0; i < instances_.length; i++)
    {
        var inst = instances_[i];
        
        for (var j = 0; j < inst.Databases().length; j++)
        {
            //There are no perf counters for MSSQLSERVER instance, but for SQLServer
            var instData = '\t{"{#SQLINST}": "' + inst.InstanceNameForPerfCnts() + '",\n"{#DBNAME}":"' + inst.Databases()[j] + '"}';
            hd += instData;
            if (j < inst.Databases().length - 1)
            {
                hd += ",";
            }
        }

        if (i < instances_.length - 1)
        {
            hd += ",";
        }
    }

    var ft = "]\n}";

    WScript.Echo(hd + ft);
}

function DiscoverSQLInstances(instances_)
{
    var hd = '{\n\n"data":[\n'
    for (var i = 0; i < instances_.length; i++)
    {
        var inst = instances_[i];
        //There are no perf counters for MSSQLSERVER instance, but for SQLServer
        var instData = '\t{"{#SQLINST}": "' + inst.InstanceNameForPerfCnts() + '"}';
        hd += instData;

        if (i < instances_.length - 1)
        {
            hd += ",";
        }
    }
    
    var ft = "]\n}";

    WScript.Echo(hd + ft);
}

function GetSQLInstance(instanceName)
{
    var q = "Select Name , PathName from Win32_Service Where PathName Like '%sqlservr.exe%' and Name ='" +
        (instanceName == "SQLServer" ? SQL_DEFAULT_INSTANCE : instanceName) + "'";

    var services = WMIExec(WMI_CIMV2, q);
    
    if (services.atEnd())
    {
        throw new Exception("Can not find isntance " + instanceName);
    }

    return  new SQLServerInstance (services.item().Name, services.item().PathName)
}

function ListSQLInstances()
{
    try
    {
        var q = "Select Name , PathName from Win32_Service Where PathName Like '%sqlservr.exe%'";        
        
        var services = WMIExec(WMI_CIMV2, q);

        var discoveredSQLInstances = [];

        //for (var i = 1; i <= services.Count ; i ++)
        for (; !services.atEnd() ; services.moveNext())
        {
            var s = services.item();
            
            var instance = new SQLServerInstance(s.Name, s.PathName);
            discoveredSQLInstances.push(instance);
        }

        return discoveredSQLInstances;
    }
    catch (e)
    {
        throw new Exception("Automation Error:" + e.message);
    }
    
}
  
try
{

    if (WScript.Arguments.length < 1) {
        throw new Exception("Invalid parameters");
    }

    var para = new Enumerator(WScript.Arguments);
    var cmd = para.item(); 
    

    switch (cmd)    
    {        
        case "SQLDB":
            DiscoverDatabases(ListSQLInstances());
            break;
        case "SQLINST":
            DiscoverSQLInstances(ListSQLInstances());
            break;
        default:
            {
                para.moveNext();                
                var srv = GetSQLInstance(cmd);
                var cmd2 = para.item();

                switch (cmd2)
                {
                    case "NAME":
                        WScript.Echo(srv.Name());
                        break;
                    case "EDITION":
                        WScript.Echo(srv.Edition());
                        break;
                    case "VERSION":
                        WScript.Echo(srv.FullVersion());
                        break;
                    case "DBMAX":
                        WScript.Echo(srv.DbMax());
                        break;
                    case "FULL":
                        WScript.Echo(srv.FullName());
                        break;
                }                
            }
    } 

}
catch (e)
{
    WScript.Quit(e.Code);
}
