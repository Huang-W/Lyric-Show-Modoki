﻿pl = {
    name: 'dplugin_AZLyrics',
    label: prop.Panel.Lang == 'ja' ? '歌詞検索: AZLyrics' : 'Download Lyrics: AZLyrics',
    author: 'tomato111',
    onStartUp: function () { // 最初に一度だけ呼び出される
    },
    onCommand: function (isAutoSearch) { // プラグインのメニューをクリックすると呼び出される

        if (!isAutoSearch && utils.IsKeyPressed(VK_CONTROL)) {
            plugins['splugin_AutoSearch'].setAutoSearchPluginName(this.name);
            return;
        }

        if (!fb.IsPlaying) {
            StatusBar.showText(prop.Panel.Lang == 'ja' ? '再生していません。' : 'Not Playing');
            return;
        }

        var debug_html = false; // for debug
        var label = this.label.replace(/^.+?: ?/, '');

        // title, artist for search
        var title = fb.TitleFormat('%title%').Eval();
        var artist = fb.TitleFormat('%artist%').Eval();

        if (!isAutoSearch) {
            title = prompt('Please input TITLE', label, title);
            if (!title) return;
            artist = prompt('Please input ARTIST', label, artist);
            if (!artist) return;
        }

        StatusBar.showText((prop.Panel.Lang == 'ja' ? '検索中......' : 'Searching......') + label);
        getHTML(null, 'GET', createQuery(title, artist), ASYNC, 0, onLoaded);

        //------------------------------------

        function createQuery(title, artist) {
            var NotAlphaNumericRE = /[^a-z0-9]/ig;
            return 'http://www.azlyrics.com/lyrics/' + artist.toLowerCase().replace(NotAlphaNumericRE, '') + '/' + title.toLowerCase().replace(NotAlphaNumericRE, '') + '.html';
        }

        function onLoaded(request, depth, file) {
            StatusBar.showText((prop.Panel.Lang == 'ja' ? '検索中......' : 'Searching......') + label);
            debug_html && fb.trace('\nOpen#' + depth + ': ' + file + '\n');

            var res = request.responseText;

            debug_html && fb.trace(res);
            var resArray = res.split(getLineFeedCode(res));
            var Page = new AnalyzePage(resArray);

            if (Page.lyrics) {
                var text = onLoaded.info + Page.lyrics;

                debug_html && fb.trace('\n' + text + '\n===End debug=============');
                if (isAutoSearch) {
                    plugins['splugin_AutoSearch'].results.push({ name: label, lyric: text });
                }
                else {
                    main(text);
                    StatusBar.showText(prop.Panel.Lang == 'ja' ? '検索終了。歌詞を取得しました。' : 'Search completed.');

                    plugin_auto_save();
                }
            }
            else {
                if (isAutoSearch) {
                    plugins['splugin_AutoSearch'].results.push({ name: label, lyric: null });
                    return;
                }
                StatusBar.hide();
                var intButton = ws.Popup(prop.Panel.Lang == 'ja' ? 'ページが見つかりませんでした。\nブラウザで開きますか？' : 'Page not found.\nOpen the URL in browser?', 0, 'Confirm', 36);
                if (intButton === 6)
                    FuncCommand('"' + file + '"');
            }

        }

        function AnalyzePage(resArray) {
            var isLyric;

            var StartLyricRE = /<!-- Usage of azlyrics/i;
            var EndLyricRE = /<\/div>/i;
            var LineBreakRE = /<br>/ig;
            var IgnoreRE = /<i>|<\/i>/ig;
            var LineFeedCode = prop.Save.LineFeedCode;

            onLoaded.info = title + LineFeedCode + LineFeedCode;
            this.lyrics = '';

            for (var i = 0; i < resArray.length; i++) {
                if (StartLyricRE.test(resArray[i])) {
                    isLyric = true; continue;
                }
                if (EndLyricRE.test(resArray[i]) && isLyric) {
                    break;
                }

                if (isLyric)
                    this.lyrics += resArray[i];
            }

            this.lyrics = this.lyrics
                .replace(LineBreakRE, LineFeedCode)
                .replace(IgnoreRE, '')
                .replaceEach('&quot;', '"', '&amp;', '&', 'ig')
                .trim();
        }

    }

};
