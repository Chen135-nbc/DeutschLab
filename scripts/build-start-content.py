"""Build the reviewed, original Studio21 A1 Einstieg content pack.

The supplied task outline establishes section names/pages, not textbook wording.
All examples and exercises here are DeutschLab originals.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'content/studio21'
out = root / 'a1/start.json'
prefix = 'studio21.a1.start'
sections = [
  dict(id='deutsch-sehen-hoeren', title='Deutsch sehen und hören', pages='8–9', summary='看见德语，听见德语：借熟悉词、图片与任务线索开始观察。',
       guide=dict(goals=['识别少量熟悉的国际词与德语词', '利用场景或标识推测词义', '知道听辨任务应注意什么'],
                  tasks=['先看图片或标识，圈出认识的词；不必逐词翻译。', '如果教材配有录音，先听整体场景，再听熟悉的词；本软件暂不提供录音或听辨评分。'],
                  wrapUp='能说出自己从词形和场景得到的线索即可；尚未听清的声音留待教材录音练习。')),
  dict(id='im-deutschkurs', title='Im Deutschkurs', pages='10–11', summary='在德语课堂上：用短句问候、说姓名、来源和居住地。',
       guide=dict(goals=['按场合使用 Hallo 或 Guten Tag', '理解并回应姓名、来源与居住地问题', '初步区分 du 与 Sie'],
                  tasks=['在教材人物或课堂图片中找出谁在说话、谁在回应。', '先认清问句要问的资料，再用自己的姓名或示例资料替换；暂不背整套动词变位。'],
                  wrapUp='能按问句选择合适资料，并说一两句自我介绍；完整变位留到 Lektion 1。')),
  dict(id='das-alphabet', title='Das Alphabet', pages='12–13', summary='德语字母表：认识字母名称，逐字母拼写姓名与城市。',
       guide=dict(goals=['认出 26 个基本字母及 ä/ö/ü/ß', '按顺序拼写简单姓名和城市', '知道词重音会影响听辨'],
                  tasks=['跟随教材或可靠录音听读字母；本软件给出名称与书面拼写，不提供音频评分。', '看着姓名逐个字母拼出，再核对字母顺序和特殊字母。'],
                  wrapUp='能从书面字母序列还原姓名，并辨别变音字母；发音准确度需靠真实音频核对。')),
  dict(id='internationale-woerter', title='Internationale Wörter', pages='14–15', summary='国际词汇与初步阅读：抓住姓名、城市等关键信息，不被生词卡住。',
       guide=dict(goals=['利用国际词和上下文理解大意', '从短人物资料提取姓名、城市与语言信息', '区分主动掌握与仅需识读的词'],
                  tasks=['先读题目问什么，再在短文中寻找姓名、城市等线索。', '遇到陌生词时先跳过，利用熟悉词和上下文完成问题；本软件阅读材料为原创。'],
                  wrapUp='能从极短资料中找到关键信息，不必逐词解释所有结构。')),
]
for section in sections:
    section.update(cardIds=[], exerciseIds=[], frameworkLinks=[])

cards = []
questions = []
def card(section, key, title, category, status, core, explanation, example, related=(), detail=()):
    sec = sections[section]
    item = dict(id=f'{prefix}.card.{key}', unitId=prefix, sectionId=sec['id'], level='A1', title=title,
                category=category, learningStatus=status, core=core, explanation=explanation,
                example=example, exampleSource='DeutschLab 原创例句', relatedIds=list(related),
                sourcePages=sec['pages'], details=list(detail))
    cards.append(item)
    sec['cardIds'].append(item['id'])
    return item['id']

L1 = 'studio21.a1.lektion1.card.'
card(0,'familiar','先认出熟悉的词','主题词汇','recognition',
     ['Hotel、Taxi、Radio 等词形容易让初学者联想到已知词。', '国际词相似不等于所有用法完全相同；先借它们判断场景。'],
     '看见词形时，先问“我在哪里可能见到它？”；本节只练识别，不要求背大量新名词。',
     'Auf dem Schild steht „Hotel“.', detail=['Hotel 在旅馆标识上容易辨认。', 'Taxi 出现在交通场景中；Radio 可指收音机或广播。'])
card(0,'visual','图片与标识是线索','交际知识','new',
     ['词语旁的图片、物品、图标和地点能帮助推测词义。', '只凭图片无法确定的词，先保留疑问，再用词典或课堂说明核对。'],
     '例如站牌旁的 Bus 比脱离场景的 Bus 更容易理解。观察不是猜测后就当成已掌握。',
     'Hier ist ein Bus.', detail=['先看地点，再看物品，最后看词。', '遇到多个可能含义时不要强行确定。'])
card(0,'task','看与听的任务怎么做','常用表达','recognition',
     ['Sehen Sie. 是“请看”；Hören Sie. 是“请听”。', '听辨时先辨场景、说话人数和熟悉词，不必一遍听懂所有词。'],
     '这些是通用课堂指令示例，不声称逐条出自教材第 8—9 页。本软件没有可靠配套音频，因此这里只讲任务方法。',
     'Hören Sie. – 请听。', detail=['第一遍只抓整体，第二遍再核对某个词。', '本单元纯文字练习不计为听力成绩。'])
card(0,'recognition','识读与主动使用分开','交际知识','new',
     ['看到熟悉词能认出，是识读；自己能在合适场景说出，才是主动使用。', '陌生词不需要在 Start 一次记完。'],
     '先建立观察策略，随后在正式单元逐步学习词汇和语法。',
     'Ich sehe das Wort „Taxi“.', detail=['练习结果只反映本次识别，不代表实际听力或口语能力。'])

card(1,'greeting','见面与问候','交际知识','new',
     ['Hallo 可用于熟悉、非正式场合；Guten Tag 常用于较正式的白天见面。', '回应时可用同类问候，不必马上展开长对话。'],
     '先看关系与场合，再选问候。课堂里对老师或陌生成年人，用 Guten Tag 更稳妥。',
     'Guten Tag! – Guten Tag!', related=[L1+'greeting'], detail=['Hallo! – Hallo! 是朋友之间的简短回应。', '问候语可先整体学习，不逐词分析语法。'])
card(1,'name','询问和介绍姓名','常用表达','new',
     ['Wie heißen Sie? 用正式称呼问“您叫什么名字？”', 'Ich heiße … 用来报出自己的姓名。'],
     'Wie 问“怎样/什么”，heißen 在这里整体理解为“叫作”；Sie 在问陌生成年人时表示“您”。暂不系统讲动词变位。',
     'Wie heißen Sie? – Ich heiße Mei.', related=[L1+'greeting',L1+'address'], detail=['问熟悉的人可说 Wie heißt du?。', '回答姓名时不用加 Ich bin，直接用 Ich heiße … 即可。'])
card(1,'origin','询问来自哪里','常用表达','new',
     ['Woher kommen Sie? 询问来源。', 'Ich komme aus China. 回答来自哪个国家或地方。'],
     'Woher 的重点是“从哪里来”，aus 在此表示“从……来”。这里按完整句型使用，不要求推导 kommen 的全套词尾。',
     'Woher kommen Sie? – Ich komme aus China.', related=[L1+'questions',L1+'regular-verbs'], detail=['回答来源时用 aus；不要把 Woher 与询问现住地的 Wo 混淆。'])
card(1,'residence','询问现在住哪里','常用表达','new',
     ['Wo wohnen Sie? 询问当前居住地。', 'Ich wohne in Berlin. 回答住在某个城市。'],
     'Wo 问“在哪里”，in 在这个示例中表示“在……”。来源和现住地可能不同。',
     'Wo wohnen Sie? – Ich wohne in Bonn.', related=[L1+'questions'], detail=['Woher kommen Sie? → Ich komme aus China.', 'Wo wohnen Sie? → Ich wohne in Bonn.'])
card(1,'address','du 和 Sie 先按场合选','交际知识','new',
     ['du 常用于熟人、同龄朋友；Sie 常用于正式或陌生成年人。', '正式问姓名：Wie heißen Sie?；非正式问姓名：Wie heißt du?。'],
     '正式 Sie 要大写；同一句中称呼和动词形式要配套。现在先识别这些固定问句，完整变位留到 Lektion 1。',
     'Hallo, Mia! Wie heißt du?', related=[L1+'address'], detail=['不确定时，对陌生成年人使用 Sie 较稳妥。'])
card(1,'person','用短句介绍他人','交际知识','exposure',
     ['Das ist … 可用于简单介绍一个人。', 'Er heißt … / Sie heißt … 分别说“他/她叫……”。'],
     '先用完整短句传达姓名，不扩展到复杂的人称代词或语序理论。',
     'Das ist Lina. Sie heißt Lina.', related=[L1+'pronouns'], detail=['本卡只需在资料中识读和简单替换姓名。'])

alphabet = [
 ('A','aː'),('B','beː'),('C','tseː'),('D','deː'),('E','eː'),('F','ɛf'),('G','ɡeː'),('H','haː'),('I','iː'),('J','jɔt'),
 ('K','kaː'),('L','ɛl'),('M','ɛm'),('N','ɛn'),('O','oː'),('P','peː'),('Q','kuː'),('R','ɛʁ'),('S','ɛs'),('T','teː'),
 ('U','uː'),('V','faʊ̯'),('W','veː'),('X','ɪks'),('Y','ʏpsilɔn'),('Z','tsɛt')]
card(2,'alphabet','26 个基本字母','发音知识','new',
     ['德语字母表有 A–Z 这 26 个基本字母，字形与英语相近，字母名称却不总相同。', '字母名称表供书面识读；准确发音要结合可靠音频或老师示范。'],
     '例如 J 的字母名称与英语 J 不同；V 的德语字母名称接近“fau”。下方 IPA 仅作参考，不能代替听音。',
     'Mein Name ist Mia: M – I – A.', detail=['把字母和字母名称对应起来，再练习姓名拼写。'])
card(2,'special','ä、ö、ü 与 ß','发音知识','new',
     ['ä、ö、ü 是带变音符号的字母；ß 称为 Eszett。', '书写时不能随意省略变音符号；ß 与字母 B 也不是同一个字母。'],
     '这里只先认形、认名称，不系统讲所有发音和拼写规则。',
     'In München steht ein ü.', detail=['输入法暂时不方便时可了解 ae/oe/ue 等替代写法，但本节知识卡保留规范拼写。'])
card(2,'spell','逐字母拼写姓名','常用表达','new',
     ['Wie schreibt man das? 可以询问“这个怎么写？”', '拼写时按字母逐个说，例如 Mia → M – I – A。'],
     '注意姓名的字母顺序；不会发某个字母时，先借书面字母表核对，不把文字题当真实听辨。',
     'Wie schreibt man „Mia“? – M – I – A.', detail=['姓名首字母大写。', '城市名也可按同样方式逐字母拼写。'])
card(2,'city','城市名与简单缩写','主题词汇','recognition',
     ['Berlin → B – E – R – L – I – N；Bonn → B – O – N – N。', '常见标识中的 EU、DB 可先认作字母序列，不要求系统学习机构名称。'],
     '本卡重点是按顺序辨认字母，不把这些示例说成教材原页内容。',
     'Berlin beginnt mit B.', detail=['EU 可逐字母识读；DB 可作为车站标识中的缩写识读。'])
card(2,'stress','词重音先有意识','发音知识','exposure',
     ['词语会有较突出的音节，叫重音。', '跟读时先注意教材或音频标出的重音，不必在 Start 背完整规则。'],
     '没有可用音频时，只能讲清“要留意什么”；程序不声称测出你的重音是否准确。',
     'Ho-tel: 读词时留意较突出的音节。', related=[L1+'stress'], detail=['重音需要听真实语音和开口模仿，文字提示只是预备知识。'])

card(3,'cognates','国际词是阅读入口','主题词汇','recognition',
     ['Hotel、Museum、Musik、Internet 可帮助识别短文主题。', '看到熟悉词先圈出来，再判断它在句中的意思。'],
     '词形相似是线索，不保证含义和用法完全相同；有疑问时查证。',
     'Das Museum ist in Berlin.', detail=['这几个词是原创练习使用的入门示例，不声称来自教材原文。'])
card(3,'profile','人物资料抓关键信息','交际知识','new',
     ['遇到极短人物资料，先找姓名、来源、城市或语言。', 'Ich heiße …、Ich komme aus …、Ich wohne in … 是三种不同线索；Ich spreche … 后面可能给出所说语言，这里只要求识读。'],
     '阅读题问姓名，就看 heiße 后的人名；问现住地，就看 wohne in 后的城市；问语言，再找 spreche 后的信息。不要把来源与现住地混为一谈。',
     'Ich heiße Noor. Ich komme aus Marokko. Ich wohne in Köln.', related=[L1+'questions'], detail=['人物资料为 DeutschLab 原创。', '地名仅作阅读线索，不要求现在记住所有国家和城市。'])
card(3,'context','借上下文读大意','交际知识','recognition',
     ['读短文时先看标题、熟悉词和问题，再找答案。', '暂时不认识的词可以跳过；不要为了一个词中断全部阅读。'],
     '例如句中有 Hotel 和 Berlin，至少能判断和地点有关，再由题目寻找具体信息。',
     'Lina wohnt in Berlin. Das Hotel ist hier.', detail=['推测后仍要核对；不要把猜测当作已掌握词义。'])
card(3,'levels','读懂任务与背会全部词不同','交际知识','new',
     ['核心掌握：本单元反复使用的问候、姓名与基本问答。', '理解识读：国际词、简单缩写和人物资料线索。', '初步接触：尚未系统讲解的动词形式与较长句子。'],
     '能回答阅读题，不等于短文每个词都要主动使用。正式语法和更多词汇将在后续单元深化。',
     'Ich lese zuerst die Frage.', detail=['学习总结按这些层级回顾，不自动将识读内容标为熟练掌握。'])

def add(section, suffix, knowledge, kind, level, prompt, explanation, **parts):
    item = dict(id=f'{prefix}.q.{suffix}', sectionId='assessment' if section is None else sections[section]['id'],
                knowledgeId=f'{prefix}.card.{knowledge}', type=kind, difficulty=level, prompt=prompt,
                explanation=explanation, **parts)
    questions.append(item)
    if section is not None: sections[section]['exerciseIds'].append(item['id'])
    return item['id']
def single(section, suffix, knowledge, level, prompt, correct, wrong, explanation):
    assert len(wrong) == 3 and len(set([correct,*wrong])) == 4
    options = [correct,*wrong]
    offset = sum(map(ord,suffix)) % 4
    ordered = options[offset:] + options[:offset]
    return add(section,suffix,knowledge,'single',level,prompt,explanation,answer='a',
               options=[dict(id=chr(97+options.index(text)),text=text) for text in ordered])
def fill(section,suffix,knowledge,level,prompt,answer,accepted,explanation):
    return add(section,suffix,knowledge,'fill',level,prompt,explanation,answer=answer,
               acceptedAnswers=accepted,gradingRule='trim-collapse-whitespace-casefold-preserve-umlauts-v1')
def match(section,suffix,knowledge,level,prompt,pairs,explanation):
    left=[dict(id=f'l{i}',text=a) for i,(a,_) in enumerate(pairs)]
    right=[dict(id=f'r{i}',text=b) for i,(_,b) in enumerate(pairs)]
    return add(section,suffix,knowledge,'match',level,prompt,explanation,answer=[f'r{i}' for i in range(len(pairs))],left=left,right=right[::-1])
def order(section,suffix,knowledge,level,prompt,words,explanation):
    tokens=[dict(id=f'w{i}',text=word) for i,word in enumerate(words)]
    return add(section,suffix,knowledge,'order',level,prompt,explanation,answer=[f'w{i}' for i in range(len(words))],tokens=tokens[::-1])

# Section 1: written recognition, never presented as audio comprehension.
single(0,'s1-hotel','familiar',1,'旅馆标识上写着 Hotel。这个词最可能指什么？','旅馆',['医院','学校','车站'],'Hotel 是容易识别的国际词；标识场景也提供线索。')
single(0,'s1-taxi','familiar',1,'路边车辆上写着 Taxi。应先把它归入哪类信息？','交通',['食物','学习用品','天气'],'Taxi 是交通场景里的熟悉词。')
match(0,'s1-match','familiar',1,'把熟悉词与最可能的中文意思对应。',[('Hotel','旅馆'),('Taxi','出租车'),('Radio','收音机/广播')],'先利用熟悉词形建立基本词义联系。')
single(0,'s1-bus','visual',2,'站牌旁有车辆图标和 Bus。哪个推断最有根据？','Bus 与公共交通有关',['Bus 一定是餐厅','Bus 是姓名','Bus 表示价格'],'图标与地点一起支持“公共交通”的推断。')
single(0,'s1-uncertain','visual',2,'只看一张模糊图片，不能确定陌生词含义。合适的做法是什么？','先保留猜测，再查证',['直接当成已掌握','跳过所有任务','把每个词都按英语读'],'上下文能帮忙，但不确定时要核对。')
single(0,'s1-hear','task',1,'看到课堂指令 Hören Sie.，学习者应做什么？','听',['读','写','匹配'],'Hören Sie. 是通用课堂“请听”的指令。')
single(0,'s1-see','task',1,'看到 Sehen Sie.，首先应做什么？','看',['写句子','付钱','读数字'],'Sehen Sie. 要求观察。')
single(0,'s1-first-listen','task',2,'教材有录音，但第一遍没听懂所有词。最合适的目标是？','先抓场景与熟悉词',['立刻记下所有语法','只看文字答案','把陌生词当作错误'],'听辨初期先抓整体，不要求第一遍逐词听懂。')
single(0,'s1-no-audio','task',2,'软件只给出文字“Hotel、Taxi”，未提供录音。这类题能证明什么？','只能检验文字识别',['已经通过真实听力测试','已经掌握发音','能独立口语交流'],'没有音频就不能把文字题当听力成绩。')
single(0,'s1-recognize','recognition',2,'看到 Radio 能猜出意思，但自己还不会在句子里使用。属于哪种状态？','理解识读',['熟练主动使用','完全掌握语法','完成口语验证'],'认得词不等于能主动使用。')
match(0,'s1-scene','visual',2,'按场景选择最有用的熟悉词。',[('旅馆门口','Hotel'),('出租车车顶','Taxi'),('收音设备旁','Radio')],'物品和地点帮助解释文字。')
single(0,'s1-combine','recognition',3,'看到 Hotel 标识和床的图标，虽然不认识旁边的长词，当前最稳妥的理解是？','这里可能与住宿有关',['这里一定卖书','已经理解全部文字','这是德语课堂'],'结合熟悉词和图标判断大意，但不声称逐词理解。')

# Section 2: fixed beginner utterances; full conjugation remains in Lektion 1.
single(1,'s2-greet-formal','greeting',2,'白天第一次见到一位不熟悉的老师，哪句问候更合适？','Guten Tag!',['Tschüss!','Gute Nacht!','Bis morgen!'],'Guten Tag! 适用于白天较正式的见面。')
single(1,'s2-greet-friend','greeting',1,'见到熟悉的同学，可用哪句简单问候？','Hallo!',['Auf Wiedersehen!','Gute Nacht!','Danke schön!'],'Hallo! 是常见的非正式问候。')
match(1,'s2-q-a','name',2,'把问题与回答对应。',[('Wie heißen Sie?','Ich heiße Ada.'),('Woher kommen Sie?','Ich komme aus China.'),('Wo wohnen Sie?','Ich wohne in Bonn.')],'姓名、来源与现住地是三种不同信息。')
fill(1,'s2-name','name',1,'补全自我介绍：Ich ___ Mei.','heiße',['heiße'],'Ich heiße … 表示“我叫……”。')
single(1,'s2-name-context','name',2,'对方问 Wie heißen Sie?，哪句直接回答了问题？','Ich heiße Nora.',['Ich wohne in Köln.','Ich komme aus China.','Ich trinke Tee.'],'Wie heißen Sie? 问姓名，不问城市或饮料。')
single(1,'s2-origin','origin',2,'“Ich komme aus China.” 回答的是哪个问题？','Woher kommen Sie?',['Wo wohnen Sie?','Wie heißen Sie?','Was trinken Sie?'],'Woher 询问来源；aus 说明从哪里来。')
fill(1,'s2-aus','origin',2,'只填一个词：Ich komme ___ China.','aus',['aus'],'Ich komme aus China. 是本节完整固定句型。')
single(1,'s2-origin-vs-home','origin',3,'Mina 来自中国，现在住在柏林。有人问 Woher kommen Sie?，哪句合适？','Ich komme aus China.',['Ich wohne in Berlin.','Ich heiße Berlin.','Berlin ist mein Name.'],'题目问来源，不是现住地。')
single(1,'s2-residence','residence',2,'“Ich wohne in Bonn.” 回答的是哪个问题？','Wo wohnen Sie?',['Woher kommen Sie?','Wie heißen Sie?','Wie schreibt man Bonn?'],'Wo wohnen Sie? 问当前住在哪里。')
fill(1,'s2-in','residence',2,'只填一个词：Ich wohne ___ Berlin.','in',['in'],'Ich wohne in Berlin. 表示住在柏林。')
single(1,'s2-city','residence',3,'Lena 来自奥地利，现在住在柏林。问 Wo wohnen Sie?，应回答哪句？','Ich wohne in Berlin.',['Ich komme aus Österreich.','Ich heiße Lena.','Ich komme aus Berlin.'],'wohnen in 对应现住地。')
single(1,'s2-sie','address',2,'向不熟悉的成年人正式询问姓名，选哪句？','Wie heißen Sie?',['Wie heißt du?','Wie heiße ich?','Wie heißen wir?'],'正式称呼用 Sie，对应固定问句 Wie heißen Sie?。')
single(1,'s2-du','address',2,'向熟悉的同龄朋友问姓名，选哪句？','Wie heißt du?',['Wie heißen Sie?','Wie heiße ich?','Wo wohnen Sie?'],'熟悉同龄朋友可用 du；问句形式也要相应改变。')
order(1,'s2-order-name','name',2,'把词语排成正式询问姓名的句子。',['Wie','heißen','Sie?'],'正式问句是 Wie heißen Sie?。')
order(1,'s2-order-home','residence',2,'把词语排成“我住在柏林”。',['Ich','wohne','in','Berlin.'],'Ich wohne in Berlin. 是本节现住地表达。')
single(1,'s2-introduce','person',2,'向同学介绍 Lina，哪句最直接？','Das ist Lina.',['Woher ist Lina?','Ich heiße Lina.','Lina wohne in Berlin.'],'Das ist … 可用于简单介绍别人。')
single(1,'s2-person','person',2,'资料写 Das ist Amir. Er heißt Amir. 句中 Er 指谁？','Amir',['说话人自己','一座城市','老师们'],'Er 在这里回指刚介绍的 Amir。')
single(1,'s2-profile','residence',3,'资料：Ich heiße Rui. Ich komme aus China. Ich wohne in Köln. 问“现在住哪儿”，应选？','in Köln',['aus China','Rui','in China'],'wohne in 后面给出当前居住地。')

# Section 3: written alphabet/name work only.
single(2,'s3-j','alphabet',1,'德语字母表中 J 的字母名称是哪项？','Jot',['Jay','Eszett','Ef'],'德语 J 的字母名称是 Jot；这里不考听音。')
single(2,'s3-v','alphabet',1,'德语 V 的字母名称是哪项？','Vau',['We','U','Fau'],'德语字母 V 称为 Vau。')
single(2,'s3-w','alphabet',2,'哪组德语字母名称对应正确？','W → We',['V → We','J → Jay','Z → Zee'],'德语 W 叫 We；V 叫 Vau。')
match(2,'s3-letter-names','alphabet',2,'把字母与德语名称对应。',[('J','Jot'),('V','Vau'),('Z','Zett')],'这些名称与英语字母名不完全一样。')
single(2,'s3-umlaut','special',1,'哪项含有德语变音字母？','München',['Berlin','Bonn','Taxi'],'München 中含 ü。')
single(2,'s3-eszett','special',1,'ß 的德语名称是什么？','Eszett',['Jot','Umlaut','We'],'ß 称为 Eszett。')
single(2,'s3-not-b','special',2,'看见 Straße 中的 ß，应如何理解？','它是 ß，不是字母 B',['它等于 B','它是数字 8','它表示空格'],'ß 与 B 字形不同；此处只要求识别。')
single(2,'s3-forms','special',2,'哪组都属于本节认识的德语特殊字母？','ä、ö、ü、ß',['a、e、i、o','A、B、C、D','1、2、3、4'],'本节认识 ä/ö/ü 和 ß。')
order(2,'s3-mia','spell',1,'按顺序拼出姓名 Mia。',['M','I','A'],'Mia 的字母顺序是 M–I–A。')
single(2,'s3-anna','spell',2,'姓名 Anna 的正确字母序列是哪项？','A – N – N – A',['A – N – A','A – M – N – A','A – N – N – E'],'Anna 的字母顺序是 A–N–N–A；重复字母不能漏掉。')
single(2,'s3-mia-sequence','spell',2,'M – I – A 可以还原为哪个姓名？','Mia',['Mai','Mina','Mira'],'按字母顺序 M、I、A 拼成 Mia。')
single(2,'s3-bonn','city',2,'B – O – N – N 对应哪个城市名？','Bonn',['Berlin','Bremen','Bonnn'],'顺序是 B–O–N–N，末尾两个 N。')
single(2,'s3-berlin','city',2,'Berlin 的首字母和末字母分别是？','B 与 N',['B 与 L','E 与 N','B 与 I'],'Berlin = B–E–R–L–I–N。')
single(2,'s3-db','city',2,'车站标识 DB 在本节应先怎样处理？','识别为 D、B 两个字母',['当作一个新动词','当作价格','当作听力成绩'],'此处只练缩写的字母识读。')
single(2,'s3-stress','stress',2,'学习词重音时，当前最合理的目标是什么？','借教材或可靠音频留意哪个音节更突出',['只凭文字判定自己发音准确','背完整语音学体系','把每个音节都读一样重'],'词重音需要听真实语音；当前只建立意识。')
single(2,'s3-audio-limit','stress',3,'软件显示字母名称文字、没有声音。完成这些题后，哪项说法准确？','我练了书面识别，发音仍需听音核对',['我的字母听力已认证','我的口音已自动评分','我不需要教材音频'],'文字题不能替代真实听辨与发音练习。')

# Section 4: original short reading snippets repeated in prompts so each item is self-contained.
single(3,'s4-museum','cognates',1,'阅读中看到 Museum，最可能指什么？','博物馆',['医院','面包','电话'],'Museum 是易识读的国际词。')
single(3,'s4-music','cognates',1,'Musik 更可能和哪项有关？','音乐',['城市','价格','姓名'],'Musik 与“音乐”词形相近，可帮助识别主题。')
match(3,'s4-international','cognates',2,'把国际词和主题对应。',[('Hotel','住宿'),('Musik','音乐'),('Internet','网络')],'熟悉词形可以帮助把握短文主题。')
single(3,'s4-name','profile',2,'原创资料：Ich heiße Noor. Ich wohne in Köln. 人物叫什么？','Noor',['Köln','Berlin','Hotel'],'heiße 后面是姓名；Köln 是居住城市。')
single(3,'s4-city','profile',2,'原创资料：Ich heiße Noor. Ich wohne in Köln. 人物住在哪？','Köln',['Noor','China','Bonn'],'wohne in 后面是现住地。')
single(3,'s4-origin','profile',3,'原创资料：Ich heiße Mei. Ich komme aus China. Ich wohne in Berlin. 她来自哪里？','China',['Berlin','Mei','Hotel'],'komme aus 提供来源，不是现住地。')
single(3,'s4-home','profile',3,'同一原创资料：Mei 来自 China，住在 Berlin。问现住地，应选？','Berlin',['China','Mei','Internet'],'住在 Berlin；来自 China。')
single(3,'s4-language','profile',2,'原创资料：Ich heiße Lea. Ich wohne in Bonn. Ich spreche Deutsch. 她说哪种语言？','Deutsch',['Bonn','Lea','Hotel'],'Ich spreche Deutsch. 给出所说语言；Bonn 是居住城市。')
single(3,'s4-find','context',2,'阅读任务只问人物姓名，最省力的做法是？','先找 Ich heiße … 后的信息',['先查清每个生词','只看最后一个词','跳过全文'],'先根据问题寻找姓名线索，不必逐词翻译。')
single(3,'s4-unknown','context',2,'短文含一个陌生词，但姓名和城市都能找到。应如何处理？','先完成能确定的问题，陌生词随后核对',['直接判定全篇无法阅读','把陌生词当姓名','宣称已掌握这个词'],'阅读入门可以先抓已知关键信息。')
single(3,'s4-context','context',3,'原创短文出现 Hotel、Berlin 和地图图标，最合理的初步推断是？','内容可能与柏林某地点有关',['每个单词都已经懂了','一定在谈动词变位','人物必定来自柏林'],'熟悉词与图标只支持大意推断，不证明逐词理解。')
single(3,'s4-active','levels',2,'看见 Internet 能认出大意，但还不会主动造句。应标成？','理解识读',['已完整掌握','已完成口语评估','必学复杂语法'],'认读和主动表达是不同目标。')
single(3,'s4-instruction','levels',2,'教材指令 Lesen Sie. 的意思是什么？','请读',['请听','请写','请匹配'],'Lesen Sie. 是常见课堂阅读指令。')

# Assessment uses different stems from the four section pools.
assessment=[]
assessment.append(single(None,'a01','familiar',1,'进入一栋楼，看见大字 HOTEL 和床形图标。先判断这里可能是？','旅馆',['电影院','药店','车站'],'词形与图标都指向住宿场景。'))
assessment.append(single(None,'a02','visual',2,'陌生标识旁有公交车图标。当前可靠的阅读策略是？','先用图标判断场景，再核对文字',['不看图标只猜拼写','把猜测当成已掌握','放弃全部阅读'],'图标提供场景线索，但仍要对照文字核实。'))
assessment.append(single(None,'a03','task',2,'没有音频的文字词汇选择题，成绩应解释为？','文字识别表现',['真实听力水平','发音准确度','完整交流能力'],'没有声音就无法评估听辨。'))
assessment.append(single(None,'a04','greeting',2,'白天第一次向陌生老师打招呼，选一句合适的开场。','Guten Tag!',['Gute Nacht!','Auf Wiedersehen!','Bis bald!'],'正式白天问候可用 Guten Tag!。'))
assessment.append(single(None,'a05','name',2,'对方正式问你的姓名，你叫 Lea。哪句回答贴切？','Ich heiße Lea.',['Ich wohne in Lea.','Ich komme aus Lea.','Wie heißen Sie?'],'回答姓名用 Ich heiße …。'))
assessment.append(single(None,'a06','origin',3,'资料：Omar 来自 Marokko，现在住在 Bonn。问 Woher kommen Sie?，应答？','Ich komme aus Marokko.',['Ich wohne in Bonn.','Ich heiße Bonn.','Ich komme aus Omar.'],'Woher 问来源；资料中的来源是 Marokko，不是现住地 Bonn。'))
assessment.append(single(None,'a07','residence',3,'同一资料：Omar 来自 Marokko，现住 Bonn。问 Wo wohnen Sie?，应答？','Ich wohne in Bonn.',['Ich komme aus Marokko.','Ich heiße Omar.','Ich wohne aus Bonn.'],'Wo wohnen Sie? 询问现住地。'))
assessment.append(single(None,'a08','address',2,'对不熟悉的成年人询问姓名，哪一对称呼和动词形式配套？','Wie heißen Sie?',['Wie heißt Sie?','Wie heißen du?','Wie heiße Sie?'],'这里先整体识记正式问句。'))
assessment.append(single(None,'a09','alphabet',1,'德国人逐字母说 J – A。这里 J 的字母名称是？','Jot',['Jay','We','Eszett'],'德语 J 称 Jot；题目只考名称知识，不包含音频。'))
assessment.append(single(None,'a10','special',2,'München 中需要特别保留哪个字母？','ü',['u','ß','ö'],'München 含 ü，不能随意省略变音符号。'))
assessment.append(single(None,'a11','spell',2,'城市 Bonn 的正确字母序列是哪项？','B – O – N – N',['B – O – N','B – N – O – N','B – O – M – N'],'Bonn 的末尾有两个 N。'))
assessment.append(single(None,'a12','city',2,'姓名 Mia 的字母序列是哪项？','M – I – A',['M – A – I','N – I – A','M – I – E'],'拼写要保持 M、I、A 的顺序。'))
assessment.append(single(None,'a13','profile',3,'原创资料：Ich heiße Lina. Ich komme aus Spanien. Ich wohne in Berlin. 哪项是居住城市？','Berlin',['Spanien','Lina','Museum'],'wohne in 后给出居住城市。'))
assessment.append(single(None,'a14','context',2,'短文只问姓名，旁边还有不认识的词。先做什么？','寻找 heiße 后的人名',['逐词翻译完再看题','把城市当成姓名','忽略所有熟悉词'],'阅读时围绕问题寻找关键信息。'))
assessment.append(single(None,'a15','levels',2,'Ergänzen Sie. 是通用课堂指令，要求做什么？','补充填写',['听录音','两人一组说话','读出城市名'],'Ergänzen Sie. 表示请补充填写；此题为通用指令示例。'))

pack = dict(packId=f'{prefix}.pack',packVersion='1.0.0',schemaVersion=1,
    source=dict(kind='user_outline',textbook='Studio21 A1',pages='8–15',
                note='依据用户提供的 Start auf Deutsch 四节概要编写原创中文讲解与题目；未取得教材原页及音频，原书细节待人工核对。'),
    unit=dict(id=prefix,level='A1',number='Start auf Deutsch',title='Start auf Deutsch',chineseTitle='德语入门',pages='8–15',
              teachingPages='8–15',practicePages='',reviewPage='',
              intro='这是正式 Lektion 1 之前的 Einstieg 引导单元。先借中文说明理解教材任务，认识问候、姓名、来源、居住地、字母和阅读线索；不要求一次掌握所有出现的语法。',
              sections=sections,assessmentIds=assessment),cards=cards,questions=questions,alphabet=[dict(letter=a,ipa=ipa) for a,ipa in alphabet])
out.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n')
print(f'{out}: {len(cards)} cards, {len(questions)} questions; sections {[len(s["exerciseIds"]) for s in sections]}')
