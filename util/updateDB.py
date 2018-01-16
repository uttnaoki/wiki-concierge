# -*- coding: utf-8 -*-

import sqlite3
import os
import getWikiData as wd
import sys

def initializeDB(dbname, dataset):
    if os.path.isfile(dbname):
        os.remove(dbname)

    create_table = '''create table place_datas (
                    name varchar(64),
                    lat real,
                    lng real,
                    value int,
                    status int,
                    article varchar(100000)
                    )'''
    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    c.execute(create_table)

    insert_sql = 'insert into place_datas (name, lat, lng, value, status, article) values (?,?,?,?,?,?)'
    place_datas = [(data['name'], data['lat'], data['lng'], \
    data['value'], data['status'], data['article']) \
    for data in dataset]
    c.executemany(insert_sql, place_datas)

    conn.commit()
    conn.close()

def editDB(data, conn):
    c = conn.cursor()
    sql = 'UPDATE place_datas SET lat=?, lng=?, value=?, status=?, article=? WHERE name = ?'
    place_data = (data['lat'], data['lng'], \
    data['value'], data['status'], data['article'], data['name'])
    c.execute(sql, place_data)

if __name__ == '__main__':
    argv = sys.argv
    argc = len(argv)

    # spots = ["後楽園","倉敷美観地区"]
    spots = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町"]

    dbname = 'database.db'
    if argc > 1:
        if argv[1] == 'reset':
            dataset = wd.getPlacesData(spots)
            initializeDB(dbname, dataset)
        elif argv[1] == 'update':
            dataset = wd.getPlacesData(spots)
            conn = sqlite3.connect(dbname)
            [editDB(d, conn) for d in dataset]
            conn.commit()
            conn.close()
