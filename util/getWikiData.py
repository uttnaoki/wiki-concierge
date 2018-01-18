# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
import urllib.request
import re
from PIL import Image

# 座標文字列の整形
def splitCoorStr(text):
    text = re.sub('北緯|南緯|東経|西経|秒|\ufeff', '', text)
    split_coor = re.split('度|分', text)
    return split_coor

def shapeWikiData(place, wiki_data):
    # info に欲しいデータを格納し，return する．
    info = {}

    # 観光施設名を格納
    info['name'] = place

    # 記事全体を取得
    Fulltext = wiki_data.find("div",class_="mw-parser-output").text
    countFulltext = len(Fulltext)
    info['value'] = countFulltext

    # 最終更新日を取得
    lastmod = wiki_data.find("li",id="footer-info-lastmod").text.split(" ")
    info['lastmod'] = lastmod[2]

    # 翻訳言語数を取得 (日本語はカウントしない)
    interlanguage = wiki_data.find("div",id="p-lang").findAll("li")
    countLang = len(interlanguage)

    # 目次の項目数を取得 (1章, 1.1節 はそれぞれ別にカウントする．)
    try:
        index_list = wiki_data.find("div",id="toc").findAll("li")
        # 最後の項目の class名 から目次数を取得
        tmp = re.search('toclevel-1 tocsection-(\d+)',str(index_list[-1]))
        itemCount = tmp.group(1)
    except:
        itemCount = 0

    # 観光施設の概要を取得
    ptag = wiki_data.find("div",class_="mw-parser-output").findAll("p")
    place_name = wiki_data.find("h1",id="firstHeading").text
    start = -1
    end = -1
    for i,a in enumerate(ptag):
        if ((a.text[0:len(place_name)] == place_name) and (start == -1)):
            start = i
        if(a.text == ""):
            end = i
            break;
    OverviewTag = ptag[start:end]
    overview = ""
    for a in OverviewTag:
        overview = overview + a.text
    info['overview'] = overview

    # 観光施設の座標を取得
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
    return info

def makeWikiURL(place):
    return 'https://ja.wikipedia.org/wiki/{0}'.format(urllib.parse.quote(place))

# 観光施設の画像を取得 (なければ NoImage.jpg をコピーして保存)
def saveImg(place, soup, img):
    infobox = soup.find("table", class_="infobox")
    thumbinner = soup.find("div", class_="thumbinner")
    if(infobox != None):
        td = infobox.find("td")
        imgtag = td.find("img")
        atag = td.find("a")
        if(imgtag != None):
            imgurl = "https:" + imgtag.get("src")
            href = atag.get("href")
    elif(thumbinner != None):
        atag = thumbinner.find("a")
        imgtag = thumbinner.find("img")
        imgurl = "https:" + imgtag.get("src")
        href = atag.get("href")
    img_path = "public/images/" + place + ".jpg"
    try:
        imglink = "https://ja.wikipedia.org" + href
    except:
        img.save(img_path)
        return;
    if("commons/thumb/1/1b/Gthumb.svg" in imgurl):
        return;
    imghtml = urllib.request.urlopen(imglink).read()
    imgsoup = BeautifulSoup(imghtml, 'lxml')
    imgtable = imgsoup.find("table", class_="layouttemplate licensetpl mw-content-ltr")
    if(imgtable == None):
        return;
    text = imgtable.find("a").text
    if(text == "クリエイティブ・コモンズ"):
        authortable = imgsoup.find("table", class_="fileinfotpl-type-information toccolours vevent mw-content-ltr")
        authortd = authortable.findAll("td")
        author = authortd[7].text
        if(author[0]+author[1] == "by"):
            author = author.encode('utf-8').split()[1].decode('utf-8')
    urllib.request.urlretrieve(imgurl,img_path)

def getPlaceData(place, img):
    url = makeWikiURL(place)
    html = urllib.request.urlopen(url).read()
    html = re.sub(r'<sup.*?</sup>', '',html.decode("utf-8"))
    wiki_data = BeautifulSoup(html, 'lxml')
    saveImg(place, wiki_data, img)
    return shapeWikiData(place, wiki_data)

def getPlacesData(places):
    # img は saveImg() で使用
    img = Image.open("public/images/NoImage.jpg")
    info = [getPlaceData(p, img) for p in places]
    return info

if __name__ == '__main__':
    # title = ["後楽園","倉敷美観地区"]
    title = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町"]
    wiki_dataset = getPlacesData(title)
