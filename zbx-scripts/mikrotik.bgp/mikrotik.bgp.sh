#!/bin/sh

ROUTER=$1
COMMAND=$2
SSH_USER=
#zabbix
SSH_ID=
#/home/zabbix/.ssh/zabbix_dsa

show_usage()
{
    echo "Mikrotik BGP peers monitoring."
    echo "Usage: `basename $0` <router> <cmd> <user> <dsa_keyfile>"
    echo "	<router> - Mikrotik's router ip"
    echo "	<cmd> - what to do"
    echo "		discover 	- get list of the bgp peers"
    echo "		status <peer> 	- get status of the peer"
    echo "	<user> - ssh user in Mikrotik router"
    echo "	<dsa_keyfile> - DSA key used to atuhenticate as <user>"
}

discover()
{
    read -a PEERS <<<` ssh -i $SSH_ID $SSH_USER@$ROUTER '/routing bgp peer print' | tail -n +3 |awk '{print $4}'`

    cnt=0
    len=${#PEERS[@]}
    let "len=len -1"
    
    
        echo '{'
	echo '	'
        echo '	"data": ['
    
    for peer in ${PEERS[@]}
    do
	echo '		{"{#PEER}": "'$peer'"}'
	
	let "cnt = cnt +1"
	
	if [ $cnt -le $len ]; then
	 echo ","
	fi
    done
    
	echo '	]'
	echo '}'
}

status()
{
    PEER=$1
    STATUS=`ssh -i $SSH_ID $SSH_USER@$ROUTER '/routing bgp peer print' | tail -n +3 |grep $PEER |awk '{print $2;}'`
    
    case "$STATUS" in
	'E')
	    echo "ESTABLISHED"
	    ;;
	'X')
	    echo "DISABLED"
	    ;;
	*)
	    echo "NA"
	    ;;
    esac

}

case "$COMMAND" in

    'discover')
	SSH_USER="$3"
	[ -n "$SSH_USER" ] || show_usage
	SSH_ID="$4"
	[ -n "$SSH_USER" ] || show_usage
	
	discover
    ;;
    
    'status')
	SSH_USER="$4"
	[ -n "$SSH_USER" ] || show_usage
	SSH_ID="$5"
	[ -n "$SSH_USER" ] || show_usage
	
	status "$3";
    ;;
    
    *)
	show_usage
    ;;
esac
