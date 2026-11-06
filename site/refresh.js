/* 近期作品内容。保留原有作品装置与交互。 */
(function () {
  'use strict';
  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function asset(name) { return window.asset('assets/projects/refresh/' + name); }
  function steps(items) {
    var list = node('ol', 'project-steps');
    items.forEach(function (item) {
      var li = node('li'); li.appendChild(node('h5', '', item[0])); li.appendChild(node('p', '', item[1])); list.appendChild(li);
    });
    return list;
  }
  function details(label, content) {
    var d = node('details', 'project-details');d.appendChild(node('summary', '', label));d.appendChild(content);return d;
  }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function calm() { return reduceMotion.matches || /[?&]flat=1/.test(location.search); }
  function enter(target, direction) {
    if(target.getAnimations)target.getAnimations().forEach(function(animation){animation.cancel();});
    if (calm() || !target.animate) return;
    return target.animate([{opacity:0,transform:'translateX(' + (direction * 16) + 'px)'},{opacity:1,transform:'translateX(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  function init() {
    var studio = document.getElementById('works-ai');
    if (!studio || !studio.querySelector('video')) return;
    // 首页行书字稿保留；近况放在已有角色定位处，不挤入姓名与人物构图。
    document.getElementById('hero-role-sub').textContent = '产品运营 · 内容策划 · AI 应用实践 · 2027 届';
    var now = node('p', 'refresh-now');now.appendChild(node('span', '', '近期作品'));
    now.appendChild(document.createTextNode('前段时间在心动参与 Cindy 产品运营，制作产品内容，也搭建可复用的工具与工作流。'));
    studio.querySelector('.project-opening').appendChild(now);
    studio.querySelector('.project-heading').textContent = '最近的作品';
    studio.querySelector('.project-description').textContent = '这里选了几支产品视频和几组海报，也放了一些制作过程。都是最近在 Cindy 的工作与实践。';
    document.getElementById('lead-works').textContent = '最近在做的 AI 与产品内容，以及过去的海外社媒、视觉创意和社区作品。';
    var aiLink = document.querySelector('.works-index a[href="#works-ai"]');
    aiLink.firstChild.textContent = '近期实践 ';

    var videoCase = document.getElementById('project-cindy-video');
    var video = videoCase.querySelector('video');
    var films = [
      {label:'交互式回答',sub:'产品演示 · 52 秒',title:'Cindy · 交互式回答',name:'交互式回答 · 中文演示',src:asset('generative-ui.mp4'),poster:asset('generative-ui.jpg'),meta:'52 秒 · 中文 · 2026.10',description:'用两份文件开始，把回答做成可以切换、改条件和继续追问的卡片。视频里既展示操作，也交代最后得到了什么。',role:'独立完成选题、脚本分镜、界面演示、动效编排与成片迭代，使用 AI 辅助制作。',note:'中文版已定版。界面依据产品组件重演，成果卡片另行采集；此处展示制作成品。',steps:[['选一个具体任务','从两份文件与明确的阅读需求开始，让功能有实际使用场景。'],['安排操作与镜头','按输入、切换、调整条件和追问的顺序组织画面。'],['检查最终成片','逐项查看界面、字幕、控件与操作结果，并制作对应英文版。']]},
      {label:'双端协作',sub:'产品动效 · 22 秒',title:'Cindy · 手机与电脑协作',name:'双端产品动效片',src:asset('motion-short.mp4'),poster:asset('motion-short.jpg'),meta:'22 秒 · 产品动效 · 2026.09',description:'手机交代任务，电脑执行，再把文件交回手机。用连续运镜和设备之间的接力，介绍跨端协作。',role:'独立完成画面编排、设备与界面动画、节奏调整和成片制作，使用 AI 辅助实现。',note:'界面依据产品资料制作，属于宣传演绎；保留原片音乐与音效。',steps:[['先交代两端关系','让手机发起、电脑执行和手机收件各有清楚的位置。'],['跟着任务移动','镜头随工作端切换，文件传递的方向与任务顺序一致。'],['统一视觉与节奏','设备、界面和字幕使用同一套节奏，重点操作保留阅读时间。']]},
      {label:'网页圈选',sub:'产品演示 · 67 秒',title:'Cindy · 网页圈选',name:'网页圈选 · 中文演示',src:asset('web-select.mp4'),poster:asset('web-select.jpg'),meta:'1 分 7 秒 · 中文 · 2026.10',description:'在网页上圈出要改的位置，直接留下评论，再回到页面查看修改。用一个连续的任务讲清操作与结果。',role:'独立完成策划、分镜、界面演示与视频制作，使用 AI 辅助；同步制作中英文版本。',note:'中文版已定版。动态操作依据实际状态重建，成片不是逐帧屏幕实录。',steps:[['明确提问对象','用具体网页内容建立任务上下文。'],['展示操作与结果','把圈选、评论和网页更新编排成连续画面。'],['完成多语言适配','同步调整界面、示例内容和字幕，保留相同的任务逻辑。']]}
    ];
    var selector = node('nav', 'film-selector');selector.setAttribute('aria-label','选择产品演示视频');
    var title = videoCase.querySelector('.project-title');title.id = 'refresh-film-title';
    video.setAttribute('aria-labelledby',title.id);
    var controls = [];
    function chooseFilm(index) {
      var f=films[index];video.pause();video.removeAttribute('src');
      var source=video.querySelector('source');source.src=f.src;video.poster=f.poster;video.load();
      title.textContent=f.title;videoCase.querySelector('.project-meta').textContent=f.meta;
      videoCase.querySelector('.project-caption>span').textContent=f.name;
      videoCase.querySelector('.project-caption a').href=f.src;
      videoCase.querySelector('.project-copy>.project-description').textContent=f.description;
      videoCase.querySelector('.project-role').textContent=f.role;videoCase.querySelector('.project-note:not([role="status"])').textContent=f.note;
      var oldSteps=videoCase.querySelector('.project-steps');oldSteps.replaceWith(steps(f.steps));
      var error=videoCase.querySelector('[role="status"]');if(error)error.hidden=true;
      controls.forEach(function(b,i){b.setAttribute('aria-pressed',i===index?'true':'false');});
      enter(videoCase.querySelector('.project-film'), 1);
    }
    films.forEach(function(f,i){
      var b=node('button','film-choice');b.type='button';b.setAttribute('aria-controls',title.id);
      var preview=node('img','film-preview');preview.src=f.poster;preview.alt='';preview.loading='lazy';b.appendChild(preview);
      b.appendChild(node('strong','',f.label));b.appendChild(node('small','',f.sub));
      b.addEventListener('click',function(){chooseFilm(i);});controls.push(b);selector.appendChild(b);
    });
    videoCase.insertBefore(selector,videoCase.firstChild);chooseFilm(0);

    // 只收录已对照官方原帖配图的版本；数字属于整条帖子，不归因于单张图。
    var series=[
      {label:'品牌里程碑',image:'selected/stars.jpg',role:'创意方向、AI 画面生成、排版与成图筛选。',variants:[
        {label:'7000 Stars',title:'Cindy · 7000 Stars',image:'selected/stars.jpg',description:'用冲向镜头的人物、黑猫和红色飘带，把开源项目的一个节点做成一张有速度感的海报。',url:'https://x.com/making_cindy/status/2115006799304859908',views:'289万+',likes:'322',promoted:true},
        {label:'Trending #1',title:'GitHub Trending · 全球第一',image:'selected/trending-en.jpg',description:'大面积的黑底、红色轨迹和人物特写，围绕「第一」组织画面，也把一起参与项目的人放进海报。',url:'https://x.com/making_cindy/status/2114632751202943290',views:'9,087',likes:'42',promoted:null}
      ]},
      {label:'模型上新',title:'GPT-6.1 Terra · 上线海报',image:'selected/terra-en.jpg',description:'用黑白几何、透视和一束青色光线组织画面。标题直接交代模型上新，人物动作把视线带向画面深处；同步制作对比卡与中英文物料。',role:'资料核对、视觉编排、文案与多语言交付。',url:'https://x.com/making_cindy/status/2114913952941625612',views:'4.6万+',likes:'29',promoted:true},
      {label:'功能主题',title:'文言界面 · 园林开卷',image:'selected/garden-published.jpg',description:'为文言界面做的一组主题探索。发布版选择晴日园林，用舒展的毛笔字和人物走入画面的动作，让功能介绍先有一点诗意。',role:'字形参考、AI 画面生成、标题排版与成图筛选。',url:'https://x.com/making_cindy/status/2117238330371064231',views:'1,602',likes:'15',promoted:true}
    ];
    var section=node('section','refresh-series');section.id='recent-visuals';section.setAttribute('aria-labelledby','recent-visuals-title');
    var sectionHead=node('div','refresh-section-head');var sectionTitle=node('h4','project-title','海报与社媒内容');sectionTitle.id='recent-visuals-title';sectionHead.appendChild(sectionTitle);
    sectionHead.appendChild(node('p','','选了品牌里程碑、模型上新和功能主题三类。每件都保留原帖，点大图可以看完整海报。'));section.appendChild(sectionHead);
    var stage=node('div','series-stage'),sheet=node('figure','series-sheet'),zoom=node('button','series-enlarge');zoom.type='button';
    var img=node('img');img.loading='lazy';zoom.appendChild(img);sheet.appendChild(zoom);
    var caption=node('figcaption');var captionName=node('span');caption.appendChild(captionName);caption.appendChild(node('span','','点击放大 ↗'));sheet.appendChild(caption);stage.appendChild(sheet);
    var copy=node('div','series-copy'),seriesTitle=node('h5'),seriesDescription=node('p'),seriesRole=node('p','series-role');
    copy.appendChild(seriesTitle);copy.appendChild(seriesDescription);copy.appendChild(seriesRole);
    var performance=node('dl','series-performance');
    var viewStat=node('div'),viewValue=node('dd'),likeStat=node('div'),likeValue=node('dd');
    viewStat.appendChild(node('dt','','X 原帖累计查看'));viewStat.appendChild(viewValue);likeStat.appendChild(node('dt','','点赞'));likeStat.appendChild(likeValue);performance.appendChild(viewStat);performance.appendChild(likeStat);copy.appendChild(performance);
    var metricNote=node('p','series-metric-note');copy.appendChild(metricNote);
    function workLink(label,cls){var a=node('a',cls,label);a.target='_blank';a.rel='noopener noreferrer';return a;}
    var workLinks=node('div','series-links'),postLink=workLink('查看 X 原帖 ↗'),imageLink=workLink('查看海报原图 ↗');workLinks.appendChild(postLink);workLinks.appendChild(imageLink);copy.appendChild(workLinks);
    var variants=node('nav','series-variants');variants.setAttribute('aria-label','选择同组海报');copy.appendChild(variants);
    var choices=node('nav','series-choices');choices.setAttribute('aria-label','选择视觉系列');stage.appendChild(copy);stage.appendChild(choices);section.appendChild(stage);
    var dialog=node('dialog','project-dialog series-dialog');dialog.setAttribute('aria-label','视觉作品大图');
    var dh=node('div','project-dialog-head'),dt=node('p'),dialogLink=workLink('查看原帖 ↗','series-dialog-link'),close=node('button','project-close','关闭 ×');close.type='button';dh.appendChild(dt);dh.appendChild(dialogLink);dh.appendChild(close);dialog.appendChild(dh);var di=node('img','refresh-full-image');dialog.appendChild(di);document.body.appendChild(dialog);
    var selected=0,activeImage='',seriesButtons=[],requestId=0,transition=null;
    function commitSeries(i,variant) {
      var s=series[i],item=s.variants?s.variants[variant]:s;
      selected=i;activeImage=item.image;img.src=asset(item.image);img.alt=(item.label||s.label)+' · 实际作品';img.style.objectFit=s.crop?'cover':'contain';img.style.objectPosition='top center';
      zoom.setAttribute('aria-label','放大查看'+(item.title||s.title));captionName.textContent=item.title||s.title;seriesTitle.textContent=item.title||s.title;seriesDescription.textContent=item.description||s.description;seriesRole.textContent=s.role;
      viewValue.textContent=item.views;likeValue.textContent=item.likes;
      metricNote.textContent='截至 2026.11.06 · '+(item.promoted?'含推广流量':'未拆分自然与推广流量')+'。数据为整条原帖的表现。';
      postLink.href=item.url;postLink.setAttribute('aria-label','查看 '+seriesTitle.textContent+' 的 X 原帖');imageLink.href=asset(item.image);dialogLink.href=item.url;
      seriesButtons.forEach(function(b,j){b.setAttribute('aria-pressed',i===j?'true':'false');});
      variants.textContent='';variants.hidden=!s.variants;
      (s.variants||[]).forEach(function(v,j){var b=node('button','series-variant',v.label);b.type='button';b.setAttribute('aria-pressed',j===variant?'true':'false');b.addEventListener('click',function(){chooseSeries(i,j);});variants.appendChild(b);});
      if(dialog.open){di.src=asset(activeImage);di.alt=img.alt;dt.textContent=captionName.textContent;}
    }
    async function chooseSeries(i,variant,instant) {
      variant=variant||0;var s=series[i],item=s.variants?s.variants[variant]:s;
      var id=++requestId,direction=i>=selected?1:-1;
      if(transition){transition.cancel();transition=null;}
      if(instant){commitSeries(i,variant);return;}
      var preload=new Image();preload.src=asset(item.image);zoom.setAttribute('aria-busy','true');
      try { await preload.decode(); } catch(error) { if(id===requestId){zoom.removeAttribute('aria-busy');captionName.textContent='图片加载失败，请重新选择';} return; }
      if(id!==requestId)return;
      if(!calm()&&zoom.animate){transition=zoom.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*12)+'px)'}],{duration:160,fill:'forwards',easing:'cubic-bezier(.22,1,.36,1)'});await transition.finished.catch(function(){});}
      if(id!==requestId)return;
      commitSeries(i,variant);if(transition){transition.cancel();transition=null;}zoom.removeAttribute('aria-busy');transition=enter(zoom,direction);
    }
    series.forEach(function(s,i){var b=node('button','series-choice');b.type='button';var thumbnail=node('img');thumbnail.src=asset(s.image);thumbnail.alt='';thumbnail.loading='lazy';b.appendChild(thumbnail);b.appendChild(node('span','',s.label));b.addEventListener('click',function(){chooseSeries(i);});choices.appendChild(b);seriesButtons.push(b);});chooseSeries(0,0,true);
    zoom.addEventListener('click',function(){di.src=asset(activeImage);di.alt=img.alt;dt.textContent=captionName.textContent;dialog.showModal();});
    close.addEventListener('click',function(){dialog.close();});dialog.addEventListener('click',function(e){if(e.target===dialog)dialog.close();});dialog.addEventListener('close',function(){zoom.focus({preventScroll:true});});
    section.appendChild(details('从资料到交付：这套内容怎样持续做',steps([
      ['先核对信息','确认来源与版本范围，保留数据口径和参考资料。'],['再组织表达','根据公告、产品介绍或品牌主题决定内容层级与视觉方向。'],['交付成套物料','保留成图、可编辑源和中英文案，发布状态单独记录。']
    ])));
    videoCase.after(section);
    var method=node('div','refresh-method');var body=node('div');body.appendChild(steps([
      ['收集反馈','从邮件或社媒收集问题，保留原始上下文。'],['诊断与查证','结合产品知识、版本和已有记录判断问题。'],['整理与跟进','去重、补充证据，形成工单或待核对回复。'],['记录处理结果','把确认的结论沉淀为可复用知识。']
    ]));body.appendChild(node('p','refresh-method-note','相关项目：客服分诊、知识检索、反馈归档。这里展示工作方法；具体个人职责与可公开材料在定稿时核对。'));
    method.appendChild(details('内容之外：我还搭建了哪些运营流程',body));studio.appendChild(method);

    var tools=node('section','refresh-tools');tools.setAttribute('aria-labelledby','refresh-tools-title');
    var head=node('div','refresh-section-head'),h=node('h3','project-title','从自己的小麻烦开始。');h.id='refresh-tools-title';head.appendChild(h);head.appendChild(node('p','','把日常计划和朋友出行里的具体问题，做成可以操作的小工具。'));tools.appendChild(head);
    var grid=node('div','refresh-tool-grid');
    [
      {name:'Northstar · 长期任务工作台',image:'northstar.png',description:'写下一段计划，先检查 AI 拆分出的任务，再确认加入待办。未完成的事持续保留，也能回看过去完成了什么。',label:'展开交互设计',detail:'自然语言整理 → 预览确认 → 日期与优先级调整 → 完成与归档。图为历史 1.2.1 界面，当前项目说明版本为 1.3.0。'},
      {name:'何时何地 · 朋友出行协调',image:'togather.jpg',description:'大家各自填写有空的时间和想去的地方，再把分散的意愿整理成几个可以讨论的出行方案。',label:'展开产品思路',detail:'把「时间 × 地点」交叉比较，让方案背后的参与情况可见；预算保留为个人意愿参考。图为项目留存的结果页。'}
    ].forEach(function(t){var article=node('article','refresh-tool'),figure=node('figure'),image=node('img');image.src=asset(t.image);image.alt=t.name+' · 项目留存界面';image.loading='lazy';figure.appendChild(image);article.appendChild(figure);article.appendChild(node('h4','',t.name));article.appendChild(node('p','',t.description));article.appendChild(details(t.label,node('p','',t.detail)));grid.appendChild(article);});
    tools.appendChild(grid);document.getElementById('practice-rally').after(tools);
    var rally=window.SITE.practice.rally,rallyFigure=document.querySelector('#practice-rally .pr-fig');
    var rallyImage=rallyFigure.querySelector('.pr-play img'),rallyCaption=rallyFigure.querySelector('.pr-cap>span');
    var rallyChoices=node('nav','rally-choices');rallyChoices.setAttribute('aria-label','选择 RALLY 1.12.0 画面');
    (rally.visual.gallery||[]).forEach(function(item,index){
      var b=node('button','rally-choice');b.type='button';b.setAttribute('aria-pressed',index===0?'true':'false');
      var thumbnail=node('img');thumbnail.src=window.asset(item.src);thumbnail.alt='';thumbnail.loading='lazy';b.appendChild(thumbnail);b.appendChild(node('span','',item.label));
      b.addEventListener('click',function(){rallyImage.src=window.asset(item.src);rallyImage.alt=item.alt;rallyCaption.textContent='1.12.0 · '+item.label;rallyChoices.querySelectorAll('button').forEach(function(button){button.setAttribute('aria-pressed',String(button===b));});enter(rallyImage,1);});rallyChoices.appendChild(b);
    });
    rallyFigure.appendChild(rallyChoices);
    // 新内容只进场一次；切换由明确点击驱动，不自动播放或抢占滚动。
    if('IntersectionObserver' in window&&!calm()){
      var revealItems=[videoCase,section,studio.querySelector('.library-case'),tools].filter(Boolean);
      var revealObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;var target=entry.target;target.classList.remove('refresh-waiting');revealObserver.unobserve(target);if(!calm()&&target.animate)target.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});});},{threshold:.04});
      revealItems.forEach(function(target){target.classList.add('refresh-waiting');revealObserver.observe(target);});
      reduceMotion.addEventListener('change',function(){if(!reduceMotion.matches)return;revealObserver.disconnect();revealItems.forEach(function(target){target.classList.remove('refresh-waiting');target.getAnimations().forEach(function(animation){animation.finish();});});});
    }
    // 新增内容之后重测滚动层；不接管原有转轮、翻页、档案夹和折角手势。
    requestAnimationFrame(function(){window.dispatchEvent(new Event('resize'));});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
