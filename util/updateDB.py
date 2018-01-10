# -*- coding: utf-8 -*-

import sqlite3
import os
import getWikiData as wd
import sys

def editDB(data, conn):

    c = conn.cursor()
    sql = 'insert into place_datas (name, lat, lng, value, status, article) values (?,?,?,?,?,?)'
    place_data = (data['name'], data['lat'], data['lng'], \
        data['value'], data['status'], data['article'])
    c.execute(sql, place_data)
    conn.commit()

def initializeDB(dbname):
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
    conn.commit()
    conn.close()

if __name__ == '__main__':
    argv = sys.argv
    argc = len(argv)

    # spots = ["後楽園","倉敷美観地区"]
    spots = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町"]
    dataset = wd.getPlacesData(spots)

    dbname = 'database.db'
    if argc > 1:
        initializeDB(dbname)

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    # [editDB(d, conn) for d in dataset]

    insert_sql = 'insert into place_datas (name, lat, lng, value, status, article) values (?,?,?,?,?,?)'
    place_datas = [(data['name'], data['lat'], data['lng'], \
        data['value'], data['status'], data['article']) \
        for data in dataset]
    c.executemany(insert_sql, place_datas)
    conn.commit()
    # select_sql = 'select * from place_datas'
    # for row in c.execute(select_sql):
    #     print(row)
    conn.close()
