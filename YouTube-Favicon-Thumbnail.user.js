// ==UserScript==
// @name         YouTube - Favicon Thumbnail
// @namespace    https://github.com/LenAnderson
// @downloadURL  https://github.com/LenAnderson/YouTube-Favicon-Thumbnail/raw/master/YouTube-Favicon-Thumbnail.user.js
// @version      0.3
// @description  Replace YouTube favicon with video thumbnail
// @author       LenAnderson
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_xmlhttpRequest
// @connect      i.ytimg.com
// ==/UserScript==

(async function() {
	'use strict';

	const log = (...msgs)=>console.log.call(console.log, '[YT-FT]', ...msgs);

	const $ = (root,query)=>(query?root:document).querySelector(query?query:root);
	const $$ = (root,query)=>Array.from((query?root:document).querySelectorAll(query?query:root));

	const wait = async(millis)=>(new Promise(resolve=>setTimeout(resolve,millis)));



	if (!window.OffscreenCanvas) {
		window.OffscreenCanvas = class OffscreenCanvas {
			el;
			constructor(width, height) {
				this.el = document.createElement('canvas'); {
					this.el.width = width;
					this.el.height = height;
				}
			}

			get getContext() { return this.el.getContext.bind(this.el); }
			async convertToBlob() {
				return new Promise(resolve=>{
					this.el.toBlob(resolve);
				});
			}
		}
	}




	let tolerance = 10;
	let orig;
	let pageUrl;
	const updateFavicon = async()=>{
		if (pageUrl == location.href) return;
		log('go');
		pageUrl = location.href;
		try {
			const idParam = location.search.substring(1).split('&').find(it=>it.substring(0,2)=='v=');
			if (idParam) {
				const id = idParam.substring(2);
				const thumbUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
				log('ajax');
				GM_xmlhttpRequest({
					method: 'GET',
					url: thumbUrl,
					responseType: 'blob',
					onload: response=>{
						log('response');
						try {
							const thumbBlob = URL.createObjectURL(response.response);
							const img = new Image();
							img.onload = async()=>{
								try {
									const w = img.naturalWidth;
									const h = img.naturalHeight;
									const editorCanvas = new OffscreenCanvas(w,h);
									const editor = editorCanvas.getContext('2d');
									editor.drawImage(img, 0, 0);
									const imgData = editor.getImageData(0,0,w,h);
									let offsetTop = 0;
									let offsetBottom = h;
									for (let y=0; y < h; y++) {
										let black = true;
										for (let x=0; x < w; x++) {
											if ((imgData.data[y*w*4+x*4+0] > tolerance
												 || imgData.data[y*w*4+x*4+1] > tolerance
												 || imgData.data[y*w*4+x*4+1] > tolerance
												) && imgData.data[y*w*4+x*4+0] > tolerance) {
												black = false;
												break;
											}
										}
										if (!black) {
											offsetTop = y;
											break;
										}
									}
									for (let y=h; y > 0; --y) {
										let black = true;
										for (let x=0; x < w; x++) {
											if ((imgData.data[y*w*4+x*4+0] > tolerance
												 || imgData.data[y*w*4+x*4+1] > tolerance
												 || imgData.data[y*w*4+x*4+1] > tolerance
												) && imgData.data[y*w*4+x*4+0] > tolerance) {
												black = false;
												break;
											}
										}
										if (!black) {
											offsetBottom = y;
											break;
										}
									}
									const hh = offsetBottom  - offsetTop;
									const size = Math.min(hh,w);
									log('ob:',offsetBottom,'ot:',offsetTop,'size:',size);
									const canvas = new OffscreenCanvas(size, size);
									const ctx = canvas.getContext('2d');
									ctx.drawImage(img,
												  (w-size)/2,offsetTop+(hh-size)/2, size,size,
												  0,0, size,size
												 );
									const blob = await canvas.convertToBlob();
									const favBlob = URL.createObjectURL(blob);
									Array.from(document.body.parentElement.querySelectorAll('[rel*="icon"]')).forEach(icon=>{
										if (!orig) {
											orig = icon.href;
										}
										icon.href = favBlob;
									});
									// debugging
// 									const blobImg = new Image();
// 									blobImg.src = favBlob;
// 									blobImg.style.position = 'fixed';
// 									blobImg.style.top = '100px';
// 									blobImg.style.left = '20px';
// 									blobImg.style.zIndex = '9999';
// 									document.body.append(blobImg);
								} catch (ex) {
									log(ex);
								}
							}
							img.src = thumbBlob;
						} catch (ex) {
							log(ex);
						}
					}
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
