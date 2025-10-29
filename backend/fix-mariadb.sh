#!/bin/bash
# Run this script to fix MariaDB system tables for XAMPP
# Usage: sudo ./fix-mariadb.sh

echo "Running MariaDB system table upgrade for XAMPP..."
/opt/lampp/bin/mariadb-upgrade -u root -p || /opt/lampp/bin/mysql_upgrade -u root -p

echo "Restarting XAMPP MySQL..."
sudo /opt/lampp/lampp stopmysql
sudo /opt/lampp/lampp startmysql

echo "Done! Now run: npm run db:migrate"

