"""Build reviewed A1 extension exercises into separate, versioned content packs."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'content/extensions/a1'

def add_single(pack, suffix, outline, card, level, prompt, correct, wrong, explanation):
    assert len(wrong) == 3 and len(set([correct, *wrong])) == 4
    prefix = 'ext.a1.numbers' if pack['topicId'] == 'A1-B03-U01' else 'ext.a1.drinks'
    options = [correct, *wrong]
    offset = (sum(map(ord, suffix)) % 4)
    options = options[offset:] + options[:offset]
    pack['questions'].append(dict(id=f'{prefix}.q.{suffix}', sectionId=outline, knowledgeId=f'{prefix}.card.{card}',
      difficulty=level, type='single', prompt=prompt, answer='a',
      options=[dict(id=chr(97 + [correct, *wrong].index(text)), text=text) for text in options], explanation=explanation))

def add_production(pack, suffix, outline, card, level, task, hints, reference, checks, common_error):
    prefix = 'ext.a1.numbers' if pack['topicId'] == 'A1-B03-U01' else 'ext.a1.drinks'
    pack['production'].append(dict(id=f'{prefix}.prod.{suffix}', outlineId=outline, knowledgeId=f'{prefix}.card.{card}',
      level=level, task=task, hints=hints, reference=reference, checks=checks, commonError=common_error))

numbers = json.loads((root / 'numbers.json').read_text())
numbers['questions'] = []
numbers['production'] = []
N = 'A1-B03-U01-P'
number_rows = [
 ('read16','01','base',1,'sechzehn 对应哪个数字？','16',['60','17','6'],'sechzehn 是 16；sechzig 是 60。'),
 ('read70','01','base',2,'号码中的 siebzig 应记为？','70',['17','7','77'],'siebzig 是 70，siebzehn 是 17。'),
 ('hundred','01','large',2,'门牌号 zweihundertfünf 应记为？','205',['250','25','2005'],'zweihundertfünf = 200 + 5。'),
 ('phone','01','phone',2,'逐个数字读作 null fünf zwei neun，号码应记为？','0529',['5029','0592','5290'],'题目明确逐位读；null 必须保留在开头。'),
 ('phone-check','01','phone',3,'你记录的是 0671；对方逐位读 null sechs sieben eins。是否一致？','一致：0671',['不一致：0761','不一致：0670','不一致：6017'],'逐位核对 0、6、7、1，顺序完全一致。'),
 ('quantity','02','quantity',2,'对方说 zwei，问的是有几个；应记录的数量是？','2',['12','20','3'],'zwei 是 2。'),
 ('ask-price','02','price',2,'想礼貌询问一个商品多少钱，可用哪个固定问句？','Wie viel kostet das?',['Wie viele sind Sie?','Woher kommt das?','Wie heißen Sie?'],'Wie viel kostet das? 可整体记作询价问句。'),
 ('price','02','price',3,'价格写为 3,50 €，哪项与之相符？','drei Euro fünfzig',['dreißig Euro fünfzig','fünf Euro dreißig','drei Euro fünfzehn'],'欧元在前、分在后；3,50 € 是三欧元五十分。'),
 ('repeat','02','confirm',2,'没有听清对方说的数字，选哪句简短请求？','Bitte noch einmal.',['Danke, zusammen.','Ich heiße Nummer.','Was trinken Sie?'],'Bitte noch einmal. 表示请再说一遍。'),
 ('order42','03','order',2,'门牌号 42 的德语写法是哪项？','zweiundvierzig',['vierundzwanzig','zweiundvierzehn','vierzigundzwei'],'42 先说个位 zwei，再说 und + vierzig。'),
 ('order24','03','order',3,'你听到 vierundzwanzig；应走向哪个门牌？','24',['42','14','40'],'vierundzwanzig = 4 + und + 20，即 24。'),
 ('pitfall','03','pitfalls',2,'十七和七十的正确配对是哪项？','siebzehn / siebzig',['siebzig / siebzehn','sieben / siebzig','siebzehn / siebzehn'],'17 是 siebzehn，70 是 siebzig。')
]
for suffix, part, card, level, prompt, correct, wrong, explanation in number_rows:
    add_single(numbers, suffix, N + part, card, level, prompt, correct, wrong, explanation)

add_production(numbers,'read-number',N+'01','base',1,'用德语写出数字 30。',['整十；注意 ß'],'dreißig',['写出完整数字词','ß 拼写正确'],'dreissig 在本练习的标准德语拼写中应写作 dreißig。')
add_production(numbers,'phone',N+'01','phone',2,'将号码 0427 按单个数字读法写成德语。',['0 = null','逐位，不按两位数分组'],'null vier zwei sieben',['保留开头的 null','顺序 0–4–2–7'],'不要写 vierhundertsiebenundzwanzig；本题要求逐位读。')
add_production(numbers,'quantity',N+'02','quantity',2,'根据“两个”写一句极简的数量回答。',['Wie viele?','可用简短回答'],'Zwei, bitte.',['表达数量 2','句子可独立回应问句'],'不要把 zwei 写成 zwölf。')
add_production(numbers,'price',N+'02','price',2,'为价格 2,50 € 写一句简单的价格句。',['Das kostet …','zwei Euro fünfzig'],'Das kostet zwei Euro fünfzig.',['金额是 2,50 €','语句有价格表达'],'不要把 2,50 € 读成 fünfundzwanzig Euro。')
add_production(numbers,'repeat',N+'02','confirm',3,'你没听清对方说的是 16 还是 60。写一到两句请求重复并核对。',['Bitte noch einmal.','sechzehn / sechzig'],'Bitte noch einmal. Sechzehn oder sechzig?',['明确请求重复','准确区分 16 与 60'],'sechzehn 是 16；sechzig 是 60。')
add_production(numbers,'door',N+'03','order',3,'你听到门牌号 42，写一句话确认这个号码。',['Ist die Hausnummer …?','42 = zweiundvierzig'],'Ist die Hausnummer zweiundvierzig?',['保留门牌信息','42 的德语顺序正确','疑问句动词在前'],'不要写成 vierundzwanzig（24）。')

drinks = json.loads((root / 'drinks.json').read_text())
drinks['questions'] = []
drinks['production'] = []
drinks['tasks'][0]['itemIds'] = ['ext.a1.drinks.prod.gern', 'ext.a1.drinks.prod.additions']
D = 'A1-B06-U04-P'
drink_rows = [
 ('milk','01','words',1,'Milch 是什么饮料？','牛奶',['果汁','矿泉水','茶'],'Milch 是牛奶；词条是 die Milch。'),
 ('juice','01','words',2,'想喝苹果汁，应选择哪项？','Apfelsaft',['Orangensaft','Mineralwasser','Milch'],'Apfelsaft 是苹果汁。'),
 ('water','01','types',2,'哪项是矿泉水？','Mineralwasser',['Orangensaft','Milch','Kaffee'],'Mineralwasser 是矿泉水。'),
 ('article','01','words',2,'哪组词条与冠词对应正确？','die Milch',['der Milch','das Milch','die Kaffee'],'Milch 的词条冠词是 die；此处只识记词条。'),
 ('cold','02','temperature',2,'你想要冷水，哪项固定搭配最合适？','kaltes Wasser',['warmer Tee','Kaffee mit Milch','heißer Saft'],'kaltes Wasser 可作为当前阶段的整体搭配使用。'),
 ('warm','02','temperature',2,'哪项表示温热的茶？','warmer Tee',['kaltes Wasser','Tee ohne Zucker','Apfelsaft'],'warmer Tee 是温热的茶，先整体识读。'),
 ('gern','02','preference',2,'Ich trinke gern Tee. 表示什么？','我喜欢喝茶',['我不喜欢喝茶','我只喝水','我要两杯茶'],'gern 表示喜欢做这件事。'),
 ('lieber','02','preference',3,'朋友问茶还是水，你更想喝水。哪句合适？','Ich trinke lieber Wasser.',['Ich trinke gern Tee.','Ich heiße Wasser.','Ich trinke ohne Wasser.'],'lieber 用于表达此时更倾向于水。'),
 ('without','02','additions',2,'想要不加糖的茶，选哪项？','Tee ohne Zucker',['Tee mit Zucker','Kaffee mit Milch','Wasser mit Zucker'],'ohne Zucker 表示不加糖。'),
 ('notgern','02','additions',3,'你不喜欢牛奶，但可以喝茶，哪句明确表达“不喜欢牛奶”？','Ich trinke Milch nicht gern.',['Ich trinke Milch gern.','Ich trinke lieber Milch.','Ich möchte Milch.'],'nicht gern 表示不喜欢；没有否定喝茶。'),
 ('order','03','order',2,'服务员问 Was trinken Sie? 你想要一杯咖啡。','Ich möchte einen Kaffee, bitte.',['Ich heiße Kaffee.','Was trinken Kaffee?','Sie möchten einen Kaffee?'],'Ich möchte …, bitte 是已接触的礼貌请求句型。'),
 ('two','03','confirm',3,'你要两杯不加糖的茶，哪项简短点单最清楚？','Zwei Tee ohne Zucker, bitte.',['Ein Tee mit Zucker, bitte.','Zwei Kaffee ohne Milch.','Tee und Zucker, bitte.'],'简短订单需同时保留数量、饮料和无糖要求。')
]
for suffix, part, card, level, prompt, correct, wrong, explanation in drink_rows:
    add_single(drinks, suffix, D + part, card, level, prompt, correct, wrong, explanation)

add_production(drinks,'order-words',D+'01','words',1,'把 ich / trinke / Saft 排成一句话。',['主语在前','动词第二位'],'Ich trinke Saft.',['三个词都出现','trinke 与 ich 搭配'],'不要写 Ich trinken Saft。')
add_production(drinks,'gern',D+'02','preference',2,'用德语说“我喜欢喝茶”。',['ich','trinken','gern','Tee'],'Ich trinke gern Tee.',['trinke 与 ich 搭配','gern 表达喜好','Tee 写对'],'不要把 gern 放在动词之前。')
add_production(drinks,'lieber',D+'02','preference',2,'你更想喝水。写一句短句。',['ich','lieber','Wasser'],'Ich trinke lieber Wasser.',['表达“更想喝”','使用 Wasser','动词形式正确'],'lieber 表示更倾向；不要误写 gern 造成意思变化。')
add_production(drinks,'additions',D+'02','additions',2,'用一句短句表达“茶，不加糖”。',['Tee','ohne Zucker','bitte'],'Tee ohne Zucker, bitte.',['饮料为茶','明确无糖','保持礼貌简短'],'mit Zucker 是加糖，不能替换 ohne Zucker。')
add_production(drinks,'order',D+'03','order',3,'你想要一杯加牛奶的咖啡。写一句礼貌订单。',['Ich möchte …, bitte.','Kaffee mit Milch'],'Ich möchte einen Kaffee mit Milch, bitte.',['饮料是咖啡','加牛奶','礼貌请求'],'mit Milch 是加牛奶；ohne Milch 是不加。')
add_production(drinks,'two-sentences',D+'03','confirm',3,'你想点两杯不加糖的茶；对方重复订单后，你确认。写两句短话。',['Zwei Tee ohne Zucker, bitte.','Ja, bitte.'],'Zwei Tee ohne Zucker, bitte. Ja, bitte.',['数量为二','饮料为茶','不加糖','有简短确认'],'别漏掉数量或把 ohne 改成 mit。')

for name, pack in [('numbers', numbers), ('drinks', drinks)]:
    (root / f'{name}.json').write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n')
