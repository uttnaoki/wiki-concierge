# -*- coding: utf-8 -*-
# import BeautifulSoup
from bs4 import BeautifulSoup
import urllib.request
import re

# 座標文字列の整形
def splitCoorStr(text):
    text = re.sub('北緯|南緯|東経|西経|秒|\ufeff', '', text)
    split_coor = re.split('度|分', text)
    return split_coor

def shapeWikiData(place, wiki_data):
    info = {}
    info['name'] = place
    fullText = wiki_data.find("div",class_="mw-parser-output").text
    info['value'] = len(fullText)
    info['article'] = fullText
    coordinateTable = wiki_data.find("span",id="coordinates")
    if not coordinateTable:
        print("座標の情報がありません")
        info['lat'] = -1
        info['lng'] = -1
        info['status'] = 0
    else:
        coordinate = coordinateTable.find("a",class_="external text").text.split(" ")
        latDedree = splitCoorStr(coordinate[0])
        lngDedree = splitCoorStr(coordinate[1])
        info['lat'] = int(latDedree[0]) + int(latDedree[1])/60 + float(latDedree[2])/3600
        info['lng'] = int(lngDedree[0]) + int(lngDedree[1])/60 + float(lngDedree[2])/3600
        info['status'] = 1
    return info;

def makeWikiURL(place):
    return 'https://ja.wikipedia.org/wiki/{0}'.format(urllib.parse.quote(place))

def getPlaceData(place):
    url = makeWikiURL(place)
    html = urllib.request.urlopen(url).read()

    wiki_data = BeautifulSoup(html, 'lxml')
    return shapeWikiData(place, wiki_data)

def getPlacesData(places):
    info = [getPlaceData(p) for p in places]
    return info

if __name__ == '__main__':
    title = ["後楽園","倉敷美観地区"]
    # title = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町"]
    wiki_dataset = getPlacesData(title)
    print(wiki_dataset)
