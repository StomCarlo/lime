/*
 * Copyright (c) 2015 - Copyright holders CIRSFID and Department of
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

// This controller loads in the metadata store the right values every time
// a new document is loaded in LIME.
Ext.define('AknMain.metadata.ImportController', {
    extend: 'Ext.app.Controller',

    requires: [
        'AknMain.xml.Document',
        'AknMain.Uri'
    ],

    listen: {
        global:  {
            loadDocument: 'onLoadDocument'
        }
    },

    // On the loadDocument event, load metadata from the original xml document.
    // No HtmlToso, no XSLTs, just plain and simple AkomaNtoso. KISS. <3
    onLoadDocument: function (config) {
        if (!config.originalXml) return;
        try {
            var akn = AknMain.xml.Document.parse(config.originalXml, 'akn'),
                store = Ext.getStore('metadata').newMainDocument(),
                uri = AknMain.Uri.parse(akn.getValue('//akn:FRBRExpression/akn:FRBRuri/@value'));
            return main ();
        } catch (e) {
            console.warn('Exception parsing metadata: ', e);
            console.warn(e.stack);
        }

        function main () {
            importReferences();
            importAliases();

            importWork();
            importExpression();
            importManifestation();

            store.set('type', akn.query('local-name(//akn:akomaNtoso/*)'));

            store.setSource(getReference('//akn:identification/@source', {
                eid: 'source',
                type: 'TLCPerson',
                href: '/ontology/person/somebody',
                showAs: 'Somebody'
            }));
        }

        function importReferences () {
            akn.select('//akn:references/*').forEach(function (reference) {
                var data = {
                    eid: reference.getAttribute('eId'),
                    type: reference.tagName,
                    href: reference.getAttribute('href'),
                    showAs: reference.getAttribute('showAs')
                }
                store.references().add(data);
            });
        }

        function importAliases () {
            akn.select('//akn:FRBRalias').forEach(function (alias) {
                var data = {
                    name: alias.getAttribute('name'),
                    value: alias.getAttribute('value'),
                    level: {
                        FRBRWork: 'work',
                        FRBRExpression: 'expression',
                        FRBRManifestation: 'manifestation',
                        FRBRItem: 'item'
                    }[alias.parentNode.tagName]
                }
                store.aliases().add(data);
            })
        }

        function importWork() {
            store.set('date',    new Date(akn.getValue('//akn:FRBRWork/akn:FRBRdate/@date') || uri.date));
            store.set('author',  uri.author);
            store.set('number',  akn.getValue('//akn:FRBRWork/akn:FRBRnumber/@value'));
            store.set('name',    akn.getValue('//akn:FRBRWork/akn:FRBRname/@value'));
            if (!store.get('name') && !store.get('number')) store.set('name', uri.name);
            store.set('subtype', akn.getValue('//akn:FRBRWork/akn:FRBRsubtype/@value') || uri.subtype);
            store.set('country', akn.getValue('//akn:FRBRWork/akn:FRBRcountry/@value') || uri.country);
            store.set('authoritative', akn.getValue('//akn:FRBRWork/akn:FRBRauthoritative/@value') === 'true');
            store.set('prescriptive', akn.getValue('//akn:FRBRWork/akn:FRBRprescriptive/@value') === 'true');
            store.setWorkAuthor(getReference('//akn:FRBRWork/akn:FRBRauthor/@href'));
            store.setWorkAuthorRole(getReference('//akn:FRBRWork/akn:FRBRauthor/@as'));
        }

        function importExpression () {
            store.set('version', new Date(akn.getValue('//akn:FRBRExpression/akn:FRBRdate/@date') || uri.version));
            store.set('language', akn.getValue('//akn:FRBRExpression/akn:FRBRlanguage/@language') || uri.language);
            store.setExpressionAuthor(getReference('//akn:FRBRExpression/akn:FRBRauthor/@href'));
            store.setExpressionAuthorRole(getReference('//akn:FRBRExpression/akn:FRBRauthor/@as'));
        }

        function importManifestation () {
            store.setManifestationAuthor(getReference('//akn:FRBRManifestation/akn:FRBRauthor/@href'));
            store.setManifestationAuthorRole(getReference('//akn:FRBRManifestation/akn:FRBRauthor/@as'));
        }

        function getReference (xpath, fallback) {
            var eid = akn.getValue(xpath).substring(1),
                reference = eid && store.references().findRecord('eid', eid);

            if (reference)
                return reference;
            else if (fallback)
                return store.references().add(fallback)[0];
        }
    }
});
