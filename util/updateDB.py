# -*- coding: utf-8 -*-

import sqlite3
import os
import getWikiData as wd
import sys
from collections import OrderedDict
from datetime import datetime

place_datas_column = OrderedDict()
place_datas_column['name'] = 'varchar(64) UNIQUE NOT NULL'
place_datas_column['lat'] = 'real'
place_datas_column['lng'] = 'real'
place_datas_column['status'] = 'int'
place_datas_column['overview'] = 'varchar(10000)'
place_datas_column['lastmod'] = 'varchar(16)'
place_datas_column['Score_countFulltext'] = 'int'
place_datas_column['Score_countLang'] = 'int'
place_datas_column['Score_itemCount'] = 'int'
place_datas_column['Score_editfrequency'] = 'int'
place_datas_column['Score_countperson'] = 'int'

def initializeDB(dbname, dataset):
    if os.path.isfile(dbname):
        os.remove(dbname)

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    # place_datas の初期化
    table_param = ','.join(['{0} {1}'.format(key,value) for key,value in place_datas_column.items()])
    create_table = 'create table place_datas ({0})'.format(table_param)
    c.execute(create_table)

    sql_column = ', '.join(place_datas_column)
    sql_values = ', '.join(['?' for i in place_datas_column])
    insert_sql = 'INSERT INTO place_datas ({0}) VALUES ({1})'.format(sql_column, sql_values)
    place_datas = [ ([data[col] for col in place_datas_column]) for data in dataset]
    c.executemany(insert_sql, place_datas)

    # unregistered の初期化
    create_table = '''create table unregistered (
                    name varchar(64) UNIQUE NOT NULL
                    )'''
    c.execute(create_table)

    # lastmod の初期化
    create_table = '''create table lastmod (
                    id int,
                    date varchar(32)
                    )'''
    c.execute(create_table)

    date = datetime.now().strftime('"%Y/%m/%d %H時%M分"')
    insert_sql = 'INSERT INTO lastmod VALUES ({0})'.format('1,'+ date)
    c.execute(insert_sql)

    conn.commit()
    conn.close()

def current_places(conn):
    c = conn.cursor()
    select_sql = 'SELECT name, lastmod FROM place_datas'
    return c.execute(select_sql)

def update_place_datas(data, conn):
    print(data)
    c = conn.cursor()

    sql_set = ','.join(['{0}=?'.format(col) for col in place_datas_column if col != 'name'])
    sql = 'UPDATE place_datas SET {0} WHERE name = ?'.format(sql_set)

    place_datas = ([data[col] for col in place_datas_column if col != 'name'] + [data['name']])

    c.execute(sql, place_datas)

def update_lastmod(conn):
    c = conn.cursor()
    date = datetime.now().strftime('%Y/%m/%d %H時%M分')
    c.execute('UPDATE lastmod SET date=? WHERE id = 1', (date,))

if __name__ == '__main__':
    argv = sys.argv
    argc = len(argv)

    dbname = 'database.db'
    if argc > 1:
        if argv[1] == 'reset':
            # places = ["倉敷美観地区"]
            places = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町","勝山町並み保存地区","玉島町並み保存地区","旧片山家住宅"]
            dataset = wd.getPlacesData(places)
            initializeDB(dbname, dataset)
        elif argv[1] == 'update':
            conn = sqlite3.connect(dbname)
            current_places = [d for d in current_places(conn)]
            [update_place_datas(data, conn) for data in wd.getPlacesData(current_places)]
            update_lastmod(conn)
            conn.commit()
            conn.close()
