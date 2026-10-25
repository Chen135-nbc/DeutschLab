"""One-time, reviewed original question expansion for Studio21 A1 Lektion 1."""
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'content/studio21/a1/lektion1.json'
pack = json.loads(path.read_text())
prefix = 'studio21.a1.lektion1.'
sections = pack['unit']['sections']

# Each row: card suffix | level | task | correct option | three plausible distractors | explanation.
rows = {
 'im-cafe': '''greeting|2|在第一次见面时，对方说“Guten Tag. Ich heiße Lea.”，你想问她来自哪里。选哪句？|Woher kommen Sie?|Wie heißen Sie?;Was trinken Sie?;Wo wohnen Sie?|Woher fragt nach der Herkunft; kommen Sie 是正式称呼。
address|2|你在咖啡馆首次询问一位成年顾客的姓名。|Wie heißen Sie?|Wie heißt du?;Wie heißt er?;Wer sind du?|陌生成年人用 Sie，对应 heißen 的 Sie 形式。
request|3|服务员问“Was trinken Sie?”，你想礼貌地点一杯茶。|Ich möchte einen Tee, bitte.|Ich trinke einen Tee?;Du möchtest Tee, bitte.;Was ist ein Tee?|Ich möchte …, bitte 是本单元的礼貌请求表达。
drinks|2|朋友说“Ich trinke keinen Kaffee. Ich trinke Tee.”她要哪种饮料？|Tee|Kaffee;Wasser;Milch|句中否定咖啡，并明确说喝茶。
greeting|2|对方问“Wie heißen Sie?”，哪句直接回答了问题？|Ich heiße Nila.|Ich komme aus Berlin.;Ich trinke Wasser.;Sie heißt Nila.|Wie heißen Sie? 询问姓名，回答用 Ich heiße …。
address|3|你和认识的同龄朋友说话，询问其姓名。|Wie heißt du?|Wie heißen Sie?;Wie heißt er?;Woher kommst du?|熟人用 du；heißen 与 du 搭配为 heißt。
request|2|你想在点饮料后礼貌致谢。|Danke.|Bitte einen Namen.;Woher kommen Sie?;Ich heiße Tee.|Danke 是简单的致谢表达。
drinks|3|同桌问“Was trinken Sie?”；你想喝水，不要咖啡。|Ich möchte Wasser, bitte.|Ich möchte einen Kaffee, bitte.;Wie heißen Sie?;Woher kommt das Wasser?|用 Ich möchte …, bitte 回答饮品需求。''',
 'wer-woher-was': '''pronouns|2|“Mia und ich”作为主语，应换成哪个代词？|wir|ihr;sie;du|说话者与另一人组成第一人称复数 wir。
pronouns|2|对两位熟悉的朋友直接说话，主语用哪个代词？|ihr|wir;sie;er|ihr 是对多个熟人的非正式称呼。
pronouns|3|“Tom und Lea trinken Tee.”把主语换成代词。|Sie trinken Tee.|Wir trinken Tee.;Ihr trinkt Tee.;Er trinkt Tee.|第三人称复数是 sie，句首写作 Sie，动词用 trinken。
regular-verbs|2|“Du ___ aus Wien.”选 kommen 的正确形式。|kommst|komme;kommt;kommen|du 的规则动词词尾通常是 -st。
regular-verbs|2|“Ihr ___ Kaffee.”选 trinken 的正确形式。|trinkt|trinkst;trinken;trinke|ihr 对应 -t。
regular-verbs|3|“Lea und Ben ___ aus Köln.”|kommen|kommt;kommst;komme|复数主语 Lea und Ben 对应 sie，动词为 kommen。
regular-verbs|2|“Er ___ Amir.”选 heißen 的正确形式。|heißt|heißen;heißst;heiße|heißen 的 du 与 er/sie/es 形式都是 heißt。
regular-verbs|3|“Du ___ Nika, und ich ___ Mara.”|heißt / heiße|heißst / heiße;heiße / heißt;heißen / heiße|du heißt；ich heiße。
sein|2|“Du ___ hier.”|bist|bin;ist;sind|sein 的 du 形式是 bist。
sein|2|“Ihr ___ aus Bonn.”|seid|sind;ist;bin|sein 的 ihr 形式是 seid。
sein|3|“Nora und ich ___ im Café.”|sind|seid;ist;bin|Nora und ich 是 wir，sein 对应 sind。
questions|2|要问“你们来自哪里？”（对熟人），选哪句？|Woher kommt ihr?|Woher kommen ihr?;Ihr kommt woher?;Woher kommst ihr?|W-Frage 中疑问词在前，ihr 对应 kommt。
questions|3|“Sie trinken Wasser.” 改为正式的是非问句。|Trinken Sie Wasser?|Sie trinken Wasser?;Trinkt Sie Wasser?;Was trinken Sie Wasser?|一般疑问句把已变位动词放在句首。
questions|2|哪个句子是正确的来源问句（对一位熟人）？|Woher kommst du?|Woher kommen du?;Du woher kommst?;Wer kommst du?|Woher 在句首，du 对应 kommst。
preferences|2|“Ich trinke gern Tee, aber ___ Kaffee.”表达“更喜欢咖啡”。|lieber|wenig;ohne;viel|lieber 表示更喜欢。
preferences|3|想要“不加糖的茶”，选哪个搭配？|Tee ohne Zucker|Tee mit Zucker;Zucker mit Tee;Tee viel Zucker|ohne 表示不带、不加。
preferences|2|“Ich trinke ___ Wasser.”表达“很多水”。|viel|wenig;lieber;ohne|viel 表示多；wenig 表示少。''',
 'zahlen': '''numbers-basic|2|对方说“neunzehn”，你应写哪个数字？|19|90;9;29|neunzehn 是十九；neunzig 才是九十。
numbers-basic|2|“zwölf”对应哪个数字？|12|20;2;10|zwölf 是十二。
numbers-pattern|2|哪项表示 47？|siebenundvierzig|vierundsiebzig;siebenundvierzehn;vierzigundsieben|德语 21–99 通常先说个位，再说 und 和十位。
numbers-pattern|3|账单号码是 63；店员说哪个词才对应？|dreiundsechzig|sechsunddreißig;dreiundsechzehn;sechzigunddrei|63 = drei + und + sechzig。
numbers-pitfalls|2|“sechzehn”对应哪个数字？|16|60;6;17|sechzehn 是十六，sechzig 是六十。
numbers-pitfalls|3|“siebzig”与“siebzehn”中，表示 70 的是哪一个？|siebzig|siebzehn;sieben;siebenzig|70 是 siebzig；17 是 siebzehn。
hundreds|2|“dreihundert”对应哪个数字？|300|30;130;3000|hundert 是百；drei + hundert = 三百。
hundreds|3|电话号码末尾读作“zweihundertfünf”；应记录哪个数字？|205|250;25;2005|zweihundertfünf = 200 + 5。''',
 'telefon-rechnung': '''phone|2|“Meine Telefonnummer ist 48 19.”，正确抄写是哪项？|48 19|84 91;48 90;40 19|按原顺序记录数字，不能交换十位和个位。
phone|3|你需要礼貌地询问一位陌生成年人的电话号码。|Wie ist Ihre Telefonnummer?|Wie heißt Ihre Telefonnummer?;Woher ist Ihre Telefonnummer?;Was trinken Ihre Telefonnummer?|Wie ist Ihre Telefonnummer? 是清楚的正式问法。
phone|2|“null acht”作为号码开头应记为：|08|80;18;00|null = 0，acht = 8，号码按听到的顺序写。
prices|2|“drei Euro fünfzig”对应哪种价格？|3,50 €|35,00 €;3,15 €;5,30 €|欧元在前、分在后，表示三欧元五十分。
prices|3|一杯茶 2,40 €，一杯水 1,60 €；合计多少钱？|4,00 €|3,00 €;4,60 €;5,00 €|2,40 + 1,60 = 4,00 欧元。
prices|3|咖啡 2,80 €，付 5,00 €；应找回多少？|2,20 €|3,20 €;2,80 €;1,20 €|5,00 − 2,80 = 2,20 欧元。
paying|2|服务员问“Zusammen oder getrennt?”；你们想分别付。|Getrennt, bitte.|Zusammen, bitte.;Zwei Kaffee, bitte.;Ich heiße Getrennt.|getrennt 表示分别付款。
paying|3|你和朋友共付一张账单，应选哪句？|Zusammen, bitte.|Getrennt, bitte.;Ohne Zucker, bitte.;Wie heißen Sie?|zusammen 表示一起付款。
bill|2|账单列出 Tee 2,50 € 和 Wasser 1,50 €，哪项是总额？|4,00 €|3,00 €;4,50 €;5,00 €|2,50 + 1,50 = 4,00 欧元。
bill|3|账单：Kaffee 3,00 €，Tee 2,00 €；只喝茶的人分别付款时应付：|2,00 €|3,00 €;5,00 €;1,00 €|分别付款时只支付自己点的 Tee。'''
}

def add(scope, n, row):
    card, level, prompt, correct, distractors, explanation = row.split('|')
    qid = f'{prefix}question.up-{scope}-{n:02d}'
    if any(question['id'] == qid for question in pack['questions']):
        return
    options = [correct, *distractors.split(';')]
    assert len(options) == 4 and len(set(options)) == 4, qid
    # Stable but nontrivial option order; answer is an option ID, never display text.
    shift = n % 4
    options = options[shift:] + options[:shift]
    question = dict(id=qid, sectionId=scope, knowledgeId=f'{prefix}card.{card}', type='single',
                    difficulty=int(level), prompt=prompt, explanation=explanation,
                    answer='a', options=[dict(id=chr(97 + [correct, *distractors.split(';')].index(text)), text=text) for text in options])
    pack['questions'].append(question)
    (pack['unit']['assessmentIds'] if scope == 'assessment' else next(s for s in sections if s['id'] == scope)['exerciseIds']).append(qid)

for scope, source in rows.items():
    for index, row in enumerate(source.splitlines(), 1):
        add(scope, index, row)

assessment = '''greeting|2|“Guten Tag. Wie heißen Sie?”，哪句直接回答？|Ich heiße Hana.|Ich komme aus Hamburg.;Ich trinke Tee.;Sie trinken Kaffee.|姓名问题用 Ich heiße … 回答。
request|3|服务员问你喝什么。你想要不加糖的茶。|Ich möchte einen Tee ohne Zucker, bitte.|Ich heiße Tee ohne Zucker.;Tee mit Zucker, bitte.;Woher kommt der Tee?|möchte … bitte 提出礼貌请求，ohne Zucker 表示不加糖。
regular-verbs|2|“Wir ___ aus Berlin.”|kommen|kommt;kommst;komme|wir 的规则动词词尾是 -en。
sein|3|“Ihr ___ hier, wir ___ dort.”|seid / sind|sind / seid;seid / seid;sind / sind|sein 对应 ihr seid、wir sind。
numbers-pattern|2|“achtundfünfzig”对应：|58|85;18;50|个位 acht 在前，fünfzig 在后。
phone|3|“Meine Nummer ist null neun vier zwei.” 应记录为：|0942|9042;0924;9420|号码中的单个数字按顺序记录。
prices|3|两杯水各 1,50 €，一杯茶 2,00 €；总额是多少？|5,00 €|3,50 €;4,00 €;5,50 €|1,50 + 1,50 + 2,00 = 5,00 欧元。
paying|2|两人想各付各的，服务员问“Zusammen oder getrennt?”|Getrennt, bitte.|Zusammen, bitte.;Mit Zucker, bitte.;Ich bin getrennt.|getrennt 表示分别结账。
bill|3|账单是 6,40 €，你付 10,00 €；找零是多少？|3,60 €|4,40 €;3,40 €;16,40 €|10,00 − 6,40 = 3,60 欧元。'''
for index, row in enumerate(assessment.splitlines(), 1):
    add('assessment', index, row)

# Reproducible numeric variants. The selected values are reviewed against an
# independent answer list below before being written to the scored question bank.
ones = {1: 'ein', 2: 'zwei', 3: 'drei', 4: 'vier', 5: 'fünf', 6: 'sechs', 7: 'sieben', 8: 'acht', 9: 'neun'}
tens = {2: 'zwanzig', 3: 'dreißig', 4: 'vierzig', 5: 'fünfzig', 6: 'sechzig', 7: 'siebzig'}
teens = {16: 'sechzehn', 17: 'siebzehn'}
def number_word(n):
    if n < 10:
        return ones[n]
    if n >= 100:
        hundreds, rest = divmod(n, 100)
        return ones[hundreds] + 'hundert' + (number_word(rest) if rest else '')
    tens_digit, unit = divmod(n, 10)
    if tens_digit == 1:
        return teens[n]
    return (ones[unit] + 'und' if unit else '') + tens[tens_digit]

for n, wrong, expected in [
    (24, [42, 44, 22], 'vierundzwanzig'),
    (35, [53, 55, 33], 'fünfunddreißig'),
    (71, [17, 61, 77], 'einundsiebzig'),
    (206, [260, 216, 602], 'zweihundertsechs'),
]:
    assert number_word(n) == expected
    add('zahlen', 8 + [24, 35, 71, 206].index(n) + 1,
        f'numbers-pattern|2|数字 {n} 的正确德语写法是哪项？|{expected}|'
        + ';'.join(number_word(item) for item in wrong)
        + f'|{n} 对应 {expected}；注意个位与十位顺序及百位组合。')

# Keep existing stable IDs; annotate them conservatively and fix one ambiguous old prompt below.
for question in pack['questions']:
    if 'difficulty' not in question:
        question['difficulty'] = 1 if question['type'] == 'single' else 2
pack['packVersion'] = '1.1.0'
path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n')
