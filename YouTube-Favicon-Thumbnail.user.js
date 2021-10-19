// ==UserScript==
// @name         YouTube - Favicon Thumbnail
// @namespace    https://github.com/LenAnderson
// @downloadURL  https://github.com/LenAnderson/YouTube-Favicon-Thumbnail/raw/master/YouTube-Favicon-Thumbnail.user.js
// @version      0.2
// @description  Replace YouTube favicon with video thumbnail
// @author       LenAnderson
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const log = (...msgs)=>console.log.call(console.log, '[YT-FT]', ...msgs);

    const $ = (root,query)=>(query?root:document).querySelector(query?query:root);
    const $$ = (root,query)=>Array.from((query?root:document).querySelectorAll(query?query:root));

    const wait = async(millis)=>(new Promise(resolve=>setTimeout(resolve,millis)));


	let orig;
	const updateFavicon = async()=>{
		try {
			const idParam = location.search.substring(1).split('&').find(it=>it.substring(0,2)=='v=');
			if (idParam) {
				const id = idParam.substring(2);
				const thumbUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
				Array.from(document.body.parentElement.querySelectorAll('[rel*="icon"]')).forEach(icon=>{
					if (!orig) {
						orig = icon.href;
					}
					icon.href = thumbUrl;
				});
			} else {
				Array.from(document.body.parentElement.querySelectorAll('[rel*="icon"]')).forEach(icon=>{
					if (orig) {
						icon.href = orig;
					}
				});
			}
		} catch (ex) {
			log(ex);
		}
	};

	const mo = new MutationObserver(updateFavicon);
	mo.observe(document.body, {attributes: true, childList: true, subtree: true });
})();
