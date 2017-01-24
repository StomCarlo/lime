/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 *
 * Authors:
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 *
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 *
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani,
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

Ext.define('ParserTest.ParserTest', {
    extend : 'Ext.app.Controller',

    listen: {
        global: {
            editorLoaded: 'importFile',
            parsingFinished: 'exportXml'
        }
    },

    importFile: function() {
        console.time('import');
        var me = this;
        var fileToParse = encodeURI(decodeURIComponent(Ext.urlDecode(window.location.search.substring(0)).fileToParse));
        var fileName = fileToParse.substring(fileToParse.lastIndexOf('/')+1);
        me.importRequest(fileName, fileToParse);
    },

    importRequest: function(name, url) {
        var me = this;
        Ext.Ajax.request({
            method: 'POST',
            url: Server.getAjaxUrl(),
            params: {
                requestedService: Statics.services.fileToHtml,
                transformFile: Config.getLanguageTransformationFile('languageToLIME'),
                fileUrl: url
            },
            success: function(res) {
                var data = Ext.decode(res.responseText, true);
                console.timeEnd('import');
                if (data && data.success) {
                    me.loadDocument(data.html, data.markinglanguage, data.language, data.xml);
                } else {
                    console.log('import success error');
                }
            },
            failure: function(res) {
                console.log('import error', res);
            }
        });
    },

    loadDocument: function(content, docMarkingLanguage, docLang, originalXml) {
        console.time('loadDocument');
        content = DomUtils.normalizeBr(content);
        // Upload the editor's content
        Ext.GlobalEvents.fireEvent(Statics.eventsNames.loadDocument, {
            docLocale: 'it',
            docType: 'act',
            docText: content,
            docMarkingLanguage: docMarkingLanguage,
            docLang: docLang,
            originalXml: originalXml
        });
    },

    exportXml: function() {
        console.log('parserFinished');
        console.timeEnd('parsers');
        // Create the Blob data and trigger the browser's saveAs dialog
        var saveDataAs = function(data) {
            var blob = new Blob([data], {type: 'text/xml;charset=utf-8'});
            saveAs(blob, 'document.xml');
        }
        console.time('export');
        this.application.fireEvent(Statics.eventsNames.translateRequest, function(xml) {
            saveDataAs(xml);
            Ext.getCmp('mainEditor').insert(0, {
                xtype: 'textareafield',
                id: 'aknResult',
                width: 400,
                value: xml
            });
            console.timeEnd('export');
        });
    }
});