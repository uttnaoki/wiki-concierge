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

def shapeWikiData(place, wiki_data, lastmod_old):
    # info に欲しいデータを格納し，return する．
    info = {}

    # 正規化前の指標値を格納
    values = {}

    # 最終更新日を取得し，更新がなければ None を return
    lastmod_new = wiki_data.find("li",id="footer-info-lastmod").text.split(" ")[2]
    if lastmod_old == lastmod_new:
        return None
    info['lastmod'] = lastmod_new

    # 観光施設名を格納
    info['name'] = place

    # 記事全体を取得
    Fulltext = wiki_data.find("div",class_="mw-parser-output").text
    countFulltext = len(Fulltext)
    values['countFulltext'] = countFulltext

    # 他言語の記事数を取得
    interlanguage = wiki_data.find("div",id="p-lang").findAll("li")
    countLang = len(interlanguage)
    values['countLang'] = countLang

    # 目次の項目数を取得 (1章, 1.1節 はそれぞれ別にカウントする．)
    try:
        index_list = wiki_data.find("div",id="toc").findAll("li")
        # 最後の項目の class名 から目次数を取得
        tmp = re.search('toclevel-1 tocsection-(\d+)',str(index_list[-1]))
        values['itemCount'] = int(tmp.group(1))
    except:
        values['itemCount'] = 0

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
    coordinateTable = wiki_data.find("span",class_="plainlinks nourlexpansion")
    if not coordinateTable:
        # print("座標の情報がありません")
        info['lat'] = -1
        info['lng'] = -1
        info['status'] = 0
    else:
        coordinate = coordinateTable.find("a",class_="external text").text
        coordinate = re.split("[ \n]",coordinate)
        latDedree = splitCoorStr(coordinate[0])
        lngDedree = splitCoorStr(coordinate[1])
        info['lat'] = int(latDedree[0]) + int(latDedree[1])/60 + float(latDedree[2])/3600
        info['lng'] = int(lngDedree[0]) + int(lngDedree[1])/60 + float(lngDedree[2])/3600
        info['status'] = 1

    # 記事の更新頻度、編集者数を取得
    href = wiki_data.find("li", id="ca-history").find("a").get("href")
    history_url = "https://ja.wikipedia.org" + href +"offset=&limit=500&action=history"
    html = urllib.request.urlopen(history_url).read()
    historysoup = BeautifulSoup(html, 'lxml')
    atag = historysoup.find("ul",id = "pagehistory").findAll("a",class_="mw-changeslist-date")
    histories = [a.text for a in atag]
    newhistory = re.split("[年月]",histories[0])
    oldhistory = re.split("[年月]",histories[-1])
    diffmonths = (int(newhistory[0]) - int(oldhistory[0]))*12 + (int(newhistory[1]) - int(oldhistory[1]))
    if(diffmonths>12):
        editfrequency = (len(histories) / diffmonths)*12
        editfrequency = int((editfrequency*2+1)//2)  #指標4(１年に更新された回数)
        values['editfrequency'] = editfrequency
    else:
        editfrequency = len(histories) #指標4(１年に更新された回数)
        values['editfrequency'] = editfrequency
    personlist = []
    editpersonList(history_url,personlist)
    countperson = len(personlist) #指標5
    values['countperson'] = countperson

    threshold = {'countFulltext': [1000,3000,5000,10000,30000],
                 'countLang': [1,3,5,10,15],
                 'itemCount':[5,10,15,20,25],
                 'editfrequency':[1,5,10,20,25],
                 'countperson':[1,15,40,70,100]}
    for name in threshold:
        info['Score_' + name] = calScore(values[name],threshold[name])
    return info

def calScore(value,threshold):
    if(value < threshold[0]):
        x = 0
    elif(value < threshold[1]):
        x = 1
    elif(value < threshold[2]):
        x = 2
    elif(value < threshold[3]):
        x = 3
    elif(value < threshold[4]):
        x = 4
    else:
        x = 5
    return x

def editpersonList(history_url,personlist):
    html = urllib.request.urlopen(history_url).read()
    historysoup = BeautifulSoup(html, 'lxml')
    people = historysoup.findAll("bdi")
    person = [a.text for a in people]
    for a in person:
        if(a not in personlist):
            personlist.append(a)

    try:
        nextlink = historysoup.find("a",class_= "mw-nextlink").get("href")
        history_url = "https://ja.wikipedia.org" + nextlink
        editpersonList(history_url,personlist)
    except:
        return personlist

def makeWikiURL(place):
    return 'https://ja.wikipedia.org/wiki/{0}'.format(urllib.parse.quote(place))

# 観光施設の画像を取得 (なければ NoImage.jpg をコピーして保存)
def saveImg(place, wiki_data, img):
    infobox = wiki_data.find("table", class_="infobox")
    thumbinner = wiki_data.find("div", class_="thumbinner")
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
    if("commons/thumb/1/1b/Gthumb.svg" in imgurl): #デフォルトの素材
        img.save(img_path)
        return;
    imghtml = urllib.request.urlopen(imglink).read()
    imgsoup = BeautifulSoup(imghtml, 'lxml')
    imgtable = imgsoup.find("table", class_="layouttemplate licensetpl mw-content-ltr")
    if(imgtable == None): #ライセンス不詳
        img.save(img_path)
        return;
    text = imgtable.find("a").text
    if(text == "クリエイティブ・コモンズ"):
        authortable = imgsoup.find("table", class_="fileinfotpl-type-information toccolours vevent mw-content-ltr")
        authortd = authortable.findAll("td")
        author = authortd[7].text
        if(author[0]+author[1] == "by"):
            author = author.encode('utf-8').split()[1].decode('utf-8')
    urllib.request.urlretrieve(imgurl,img_path)

def getPlaceData(data, img):
    if len(data) == 2:
        place = data[0]
        lastmod = data[1]
    else:
        place = data
        lastmod = 0

    url = makeWikiURL(place)
    html = urllib.request.urlopen(url).read()
    html = re.sub(r'<sup.*?</sup>', '',html.decode("utf-8"))
    wiki_data = BeautifulSoup(html, 'lxml')
    wd = shapeWikiData(place, wiki_data, lastmod)

    # 記事が更新されていれば画像を取得
    if wd is not None:
        saveImg(place, wiki_data, img)
        return wd
    # 記事が更新されていなければ return しない

def getPlacesData(places):
    # img は saveImg() で使用
    img = Image.open("public/images/NoImage.jpg")
    info = [getPlaceData(p, img) for p in places]
    # 更新なしのデータ(None)を削除
    info = [d for d in info if d is not None]
    return info

if __name__ == '__main__':
    # title = ["後楽園","倉敷美観地区"]
    # title = [["後楽園",'2017年12月16日'],["倉敷美観地区",'2018年1月7日']]
    title = ["後楽園","倉敷美観地区","岡山城","吉備津神社","最上稲荷","鬼ノ城","鷲羽山ハイランド","井倉洞","満奇洞","湯原温泉","湯郷温泉","津山城","ドイツの森","吹屋ふるさと村郷土館","旧矢掛本陣石井家","奥津渓","美星町","勝山町並み保存地区","玉島町並み保存地区","旧片山家住宅"]
    wiki_dataset = getPlacesData(title)
