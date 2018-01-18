# -*- coding: utf-8 -*-

import sqlite3
import os
import getWikiData as wd
import sys

def initializeDB(dbname, dataset):
    if os.path.isfile(dbname):
        os.remove(dbname)

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    # place_datas の初期化
    create_table = '''create table place_datas (
                    name varchar(64) UNIQUE NOT NULL,
                    lat real,
                    lng real,
                    value int,
                    status int,
                    overview varchar(100000),
                    lastmod varchar(16)
                    )'''
    c.execute(create_table)

    insert_sql = 'INSERT INTO place_datas (name, lat, lng, value, status, overview, lastmod) VALUES (?,?,?,?,?,?,?)'
    place_datas = [(data['name'], data['lat'], data['lng'], \
        data['value'], data['status'], data['overview'], data['lastmod']) \
        for data in dataset]
    c.executemany(insert_sql, place_datas)

    # unregistered の初期化
    create_table = '''create table unregistered (
                    name varchar(64) UNIQUE NOT NULL
                    )'''
    c.execute(create_table)

    conn.commit()
    conn.close()

def current_places(conn):
    c = conn.cursor()
    select_sql = 'SELECT name FROM place_datas'
    return c.execute(select_sql)

def editDB(data, conn):
    c = conn.cursor()
    sql = 'UPDATE place_datas SET lat=?, lng=?, value=?, status=?, overview=?, lastmod=? WHERE name = ?'
    place_data = (data['lat'], data['lng'], data['value'], \
        data['status'], data['overview'], data['lastmod'], data['name'])
    c.execute(sql, place_data)

if __name__ == '__main__':
    argv = sys.argv
    argc = len(argv)

    spots = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町"]

    dbname = 'database.db'
    if argc > 1:
        if argv[1] == 'reset':
            dataset = wd.getPlacesData(spots)
            initializeDB(dbname, dataset)
        elif argv[1] == 'update':
            conn = sqlite3.connect(dbname)
            current_spots = [s[0] for s in current_places(conn)]
            [editDB(data, conn) for data in wd.getPlacesData(current_spots)]
            conn.commit()
            conn.close()
