/* 成品与工具案例：事实由 shared/content.js 提供，不依赖远程服务。 */
(function () {
  'use strict';
  window.renderProjectCases = function (helpers) {
    var el = helpers.el, asset = helpers.asset, P = window.SITE.projects;
    if (!P) return;

    function image(src, alt, cls) {
      var node = el('img', cls);
      node.src = asset(src); node.alt = alt;
      node.loading = 'lazy'; node.decoding = 'async';
      return node;
    }
    function steps(items) {
      var list = el('ol', 'project-steps');
      items.forEach(function (item) {
        var li = el('li');
        li.appendChild(el('h5', null, item.title));
        li.appendChild(el('p', null, item.text));
        list.appendChild(li);
      });
      return list;
    }
    function disclosure(label, content) {
      var details = el('details', 'project-details');
      details.appendChild(el('summary', null, label));
      details.appendChild(content);
      return details;
    }

    var studio = document.getElementById('works-ai');
    var header = el('header', 'project-opening');
    var heading = el('div');
    heading.appendChild(el('p', 'project-context', '心动实习 · AI 工作流与内容制作'));
    var title = el('h3', 'project-heading'); title.id = 'studio-title';
    P.heading.split('，').forEach(function (line, i) { title.appendChild(el('span', null, line + (i === 0 ? '，' : ''))); });
    heading.appendChild(title); header.appendChild(heading);
    header.appendChild(el('p', 'project-description', P.intro));
    studio.appendChild(header);

    var V = P.video, videoCase = el('article', 'video-case');
    videoCase.id = 'project-cindy-video';
    var videoHead = el('div', 'project-case-head');
    var videoTitle = el('h4', 'project-title', V.title);
    videoHead.appendChild(videoTitle);
    videoHead.appendChild(el('p', 'project-meta', V.meta));
    videoCase.appendChild(videoHead);
    var figure = el('figure', 'project-film');
    var video = el('video');
    video.controls = true; video.playsInline = true; video.preload = 'none';
    video.width = 1920; video.height = 1080;
    video.poster = asset(V.poster);
    video.setAttribute('aria-label', V.name);
    var source = el('source'); source.src = asset(V.src); source.type = 'video/mp4';
    video.appendChild(source);
    video.appendChild(document.createTextNode('浏览器不支持内嵌视频，请使用下方链接打开成片。'));
    figure.appendChild(video);
    var caption = el('figcaption', 'project-caption');
    caption.appendChild(el('span', null, V.name));
    var openVideo = el('a', 'link', '打开完整视频 ↗');
    openVideo.href = asset(V.src); openVideo.target = '_blank'; openVideo.rel = 'noopener';
    caption.appendChild(openVideo); figure.appendChild(caption);
    var error = el('p', 'project-note'); error.hidden = true; error.setAttribute('role', 'status');
    source.addEventListener('error', function () { error.hidden = false; error.textContent = '视频暂时无法加载，请使用上方链接打开成片。'; });
    videoCase.appendChild(figure); videoCase.appendChild(error);
    var videoCopy = el('div', 'project-copy');
    videoCopy.appendChild(el('p', 'project-description', V.description));
    var credit = el('div'); credit.appendChild(el('p', 'project-role', V.role));
    credit.appendChild(el('p', 'project-note', V.note));
    videoCopy.appendChild(credit); videoCase.appendChild(videoCopy);
    videoCase.appendChild(disclosure('查看创作过程与工作流', steps(V.steps)));
    studio.appendChild(videoCase);
    // 切到后台时暂停，保留进度；不强制恢复播放。
    document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); });

    var L = P.library, library = el('article', 'library-case');
    library.id = 'project-motion-atlas';
    var libraryCopy = el('div', 'library-copy');
    libraryCopy.appendChild(el('h4', 'project-title', L.title));
    libraryCopy.appendChild(el('p', 'project-subtitle', L.subtitle));
    libraryCopy.appendChild(el('p', 'project-description', L.description));
    libraryCopy.appendChild(el('p', 'project-role', L.role));
    libraryCopy.appendChild(steps(L.steps));
    var libraryFigure = el('figure', 'library-figure');
    var expand = el('button', 'library-expand'); expand.type = 'button';
    expand.setAttribute('aria-label', '放大查看动效素材库实际界面');
    expand.appendChild(image(L.image, L.alt));
    expand.appendChild(el('span', 'library-zoom', '查看界面 ↗'));
    libraryFigure.appendChild(expand);
    libraryFigure.appendChild(el('figcaption', 'project-note', L.note));
    library.appendChild(libraryFigure); library.appendChild(libraryCopy);
    studio.appendChild(library);

    var dialog = el('dialog', 'project-dialog');
    dialog.setAttribute('aria-label', '动效素材库界面大图');
    var dialogHead = el('div', 'project-dialog-head');
    dialogHead.appendChild(el('p', null, '动效素材库 · 实际界面'));
    var close = el('button', 'project-close', '关闭 ×'); close.type = 'button';
    dialogHead.appendChild(close); dialog.appendChild(dialogHead);
    dialog.appendChild(image(L.image, L.alt));
    document.body.appendChild(dialog);
    expand.addEventListener('click', function () { dialog.showModal(); });
    close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { expand.focus({preventScroll:true}); });

    var F = P.photo, photo = document.getElementById('practice-photo');
    var intro = el('div', 'photo-copy');
    var photoTitle = el('h3', 'project-title', F.title); photoTitle.id = 'photo-title';
    intro.appendChild(photoTitle);
    intro.appendChild(el('p', 'project-subtitle', F.subtitle));
    intro.appendChild(el('p', 'project-description', F.description));
    intro.appendChild(el('p', 'project-role', F.role));
    intro.appendChild(disclosure('查看实现方式', el('p', 'project-description', F.details)));
    photo.appendChild(intro);

    var photoFigure = el('figure', 'photo-figure');
    var styleGroup = el('div', 'photo-styles');
    styleGroup.setAttribute('role', 'group'); styleGroup.setAttribute('aria-label', '选择调色风格');
    var compare = el('div', 'photo-compare'); compare.style.setProperty('--split', '50%');
    var before = image(F.before, F.alt + '：默认显影', 'photo-before');
    var after = image(F.styles[0].image, F.alt + '：' + F.styles[0].name, 'photo-after');
    before.width = after.width = 1440; before.height = after.height = 1080;
    compare.appendChild(before); compare.appendChild(after);
    var beforeLabel = el('span', 'photo-label photo-label--before', '默认显影');
    var afterLabel = el('span', 'photo-label photo-label--after', F.styles[0].name);
    compare.appendChild(beforeLabel); compare.appendChild(afterLabel);
    var line = el('span', 'photo-divider'); line.setAttribute('aria-hidden', 'true');
    line.appendChild(el('span', null, '↔')); compare.appendChild(line);
    var range = el('input', 'photo-range');
    range.type = 'range'; range.min = '0'; range.max = '100'; range.value = '50';
    range.setAttribute('aria-label', '调色前后对比分界位置');
    range.setAttribute('aria-describedby', 'photo-compare-help');
    function split() {
      compare.style.setProperty('--split', range.value + '%');
      range.setAttribute('aria-valuetext', '默认显影占 ' + range.value + '%，调色结果占 ' + (100 - Number(range.value)) + '%');
    }
    range.addEventListener('input', split); split(); compare.appendChild(range);
    var state = el('p', 'photo-status'); state.setAttribute('role', 'status');
    var serial = 0, buttons = [];
    F.styles.forEach(function (style, index) {
      var button = el('button', 'photo-style', style.name); button.type = 'button';
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', function () {
        var ticket = ++serial;
        state.textContent = '正在载入' + style.name + '…';
        var next = new Image();
        next.onload = function () {
          if (ticket !== serial) return;
          after.src = next.src; after.alt = F.alt + '：' + style.name;
          afterLabel.textContent = style.name;
          buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
          state.textContent = '已切换至' + style.name;
        };
        next.onerror = function () { if (ticket === serial) state.textContent = '该风格暂时无法加载，请重试或选择其他风格。'; };
        next.src = asset(style.image);
      });
      buttons.push(button); styleGroup.appendChild(button);
    });
    photoFigure.appendChild(styleGroup); photoFigure.appendChild(compare);
    var help = el('figcaption', 'project-note', F.note); help.id = 'photo-compare-help';
    photoFigure.appendChild(help); photoFigure.appendChild(state);
    photo.appendChild(photoFigure);
  };
}());
