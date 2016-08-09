/**
 * Provided under the MIT License (c) 2014
 * See LICENSE @file for details.
 *
 * @file Pictre.js
 *
 * @author juanvallejo
 * @date 01/03/15
 *
 * Album app for interfacing with stored pictures on private cloud server.
 * http://static-pictre.rhcloud.com
 *
 * Note: @callback_params refer to parameters passed to a lambda function
 * Note: Requires a PHP server to serve 'data.php' @ ../static/php/static/data.php
 * Note: Requires the following dependencies / node.js packages for local testing:
 *
 *       - node.js       -> js server framework
 *       - npm           -> node.js package manager 
 *
 * TODO: Improve cascade-image-loading algorithm
 */

(function(window, document, Pictre) {

	Pictre = {

		_404: {

			div: document.createElement("div"),
			exists: false,

			put: function(a) {

				var self = this;
				var a = a || "There seems to be nothing here.";

				this.div.className = "Pictre-empty";
				this.div.innerHTML = a;
				this.exists = true;

				Pictre._settings.wrapper.appendChild(this.div);

				this.position();

				Pictre.events.on('resize', function() {

					if (self.exists) {
						self.position();
					}

				});

			},

			remove: function() {
				if (this.exists) {
					this.exists = false;
					Pictre._settings.wrapper.removeChild(this.div);
				}
			},

			position: function() {
				this.div.style.left = ($(window).width() / 2 - (this.div.clientWidth / 2)) + "px";
				this.div.style.top = (($(window).height() - (Pictre.get.ui.menu._div.offsetHeight * 2)) / 2 - (this.div.clientHeight / 2)) + "px";
			}

		},
		_settings: {
			allowUploads: true,
			app: {
				address: "http://" + window.location.host + "/",
				title: 'Pictre'
			},
			cloud: {
				datadir: 'http://static-pictre.rhcloud.com/',
				address: 'http://static-pictre.rhcloud.com/static/'
			},
			data: {
				album: null,
				anchor: 0,
				condition: null,
				limit: {
					request: 25,
					pageload: 50
				},
				kind: 0,
				visited: 0.6
			},
			demo: {
				loader: false,
				upload: false
			},
			minWidth: 800,
			pages: {
				restricted: ['data', 'restricted', '404', 'undefined']
			},
			picture: {
				maxWidth: 800
			},
			enableLock: true,
			speed: 500,
			spotlight: {
				transitionSpeed: 750,
				useDocumentElement: false
			},
			uploadLimit: 20,
			wrapper: null
		},
		_storage: {
			_loadonready: function() {
				var self = this;
				this.gallery.onready.call(this.gallery);
				Pictre._storage.window.width = window.innerWidth;
				Pictre.events.on('resize', function() {
					if (Pictre.client.id == 3) {
						if (Pictre._storage.window.innerWidth) {
							if (Pictre._storage.window.innerWidth != window.innerWidth) Pictre.chisel(), Pictre._storage.window.innerWidth = window.innerWidth;
						} else {
							Pictre._storage.window.innerWidth = window.innerWidth;
						}
					} else if (window.innerWidth != Pictre._storage.window.width) self.chisel(), Pictre._storage.window.width = window.innerWidth;
					if (self.gallery.is.featuring) {
						if (self._storage.overlay.image) {
							self.gallery.overlay.image.position(self._storage.overlay.image);
						}
					}
				});
				Pictre.events.on('scroll', function() {
					if ($(document).scrollTop() - Pictre._storage.data.lastScrollTop >= 0) Pictre.is.scrollingDown = true;
					else Pictre.is.scrollingDown = false;
					Pictre._storage.data.lastScrollTop = $(document).scrollTop();
					if (!Pictre.is.spotlight && !Pictre.is.busy) {
						//	if($(document).height()-$(document).scrollTop() <= $(document).height()*0.6) {
						if ($(document).height() - $(window).height() - $(document).scrollTop() <= 100 + $(document).height() * 0.05) {
							if (!Pictre.is.loading && !Pictre.is.done && Pictre.is.scrollingDown) {
								Pictre.is.loading = true;
								Pictre.get.db({
									from: 'all'
								}, function(data) {
									Pictre.load(data, {
										method: 'append'
									});
									if (!data.length) Pictre.is.done = true;
								});
							}
						}
						if (Pictre._settings.spotlight.useDocumentElement) {
							if (document.body.scrollTop > 0) Pictre._settings.spotlight.useDocumentElement = false;
						}
					}
				});
			},
			chisel: {
				count: 0,
				queued: true,
				top: 0
			},
			comments: {
				author: null
			},
			data: {
				deleted: 0,
				lastScrollTop: 0,
				loaded: 0,
				total: 0,
				totalDiv: null
			},
			iterator: 0,
			loaded: 0,
			overlay: {
				onexit: [],
				image: null,
				iterator: 0,
				locked: false
			},
			pictures: [],
			scrollTop: null,
			upload: {
				method: 'replace',
				offset: 0,
				overflow: null
			},
			window: {
				innerWidth: null,
				width: null
			}
		},
		board: {
			detect: function() {
				if (window.location.pathname.split("/")[1]) this.is.set = true, document.title = "Pictre - " + this.get();
				else this.is.set = false, document.title = Pictre._settings.app.title;
			},
			exists: false,
			get: function() {
				var r;
				if (this.is.set) {
					var f = window.location.pathname.split("/")[1].toLowerCase();
					var fa = f.split("");
					fa.splice(0, 1);
					var c = f.charAt(0).toUpperCase();
					r = c + fa.join("");
				}
				return r;
			},
			is: {
				set: false
			},
			set: {
				state: function(a) {
					Pictre._settings.data.kind = a;
					Pictre.board.state = a;
					if (Pictre._settings.data.kind < 1) {
						Pictre._settings.allowUploads = false;
						if (!Pictre.gallery.is.featuring) {
							Pictre.get.ui.passcode.put('create');
						} else {
							Pictre.gallery.overlay.onexit(function() {
								Pictre.get.ui.passcode.put('create');
							});
						}
					} else if (Pictre._settings.data.kind == 1) {
						Pictre.get.ui.menu.removeButton('unlock');
						var title = 'This album is locked. Click to edit or remove images and comments.';
						Pictre.get.ui.menu.addButton({
							id: 'lock',
							name: 'lock',
							title: title
						}).on('click', function() {
							Pictre.get.ui.passcode.put('unlock');
						});
						if (Pictre.is.spotlight) Pictre.get.ui.menu.hideButton('lock');
					} else if (Pictre._settings.data.kind == 2) {
						Pictre.get.ui.menu.removeButton('lock');
						var title = 'The album is unlocked, you are authorized to make changes. Click to lock.';
						Pictre.get.ui.menu.addButton({
							id: 'unlock',
							name: 'unlock',
							title: title
						}).on('click', function() {
							Pictre.board.set.state(1);
						});
						if (Pictre.is.spotlight) Pictre.get.ui.menu.hideButton('unlock');
					}
				}
			},
			state: 0
		},
		chisel: function(a) {
			var windowWidth = window.innerWidth;
			var itemWidth = this._storage.pictures[0].offsetWidth;
			var itemMargin = 0;
			var columnCount = 0;
			if (windowWidth && itemWidth) {
				itemMargin = parseInt(window.getComputedStyle(this._storage.pictures[0]).getPropertyValue('margin-left').split("px")[0] * 2);
				columnCount = Math.floor(windowWidth / (itemWidth + itemMargin));
				if (columnCount > this._storage.pictures.length) {
					columnCount = this._storage.pictures.length;
				}
				this._settings.wrapper.style.width = (columnCount * (itemWidth + itemMargin)) + "px";
				if (a) {
					var x = a + 1;
					for (var i = x; i < x + Pictre._settings.data.limit.request; i++) {
						var top = parseInt(this._storage.pictures[i - columnCount].style.top.split("px")[0]) + this._storage.pictures[i - columnCount].offsetHeight + itemMargin;
						this._storage.pictures[i].style.left = this._storage.pictures[i - columnCount].style.left;
						this._storage.pictures[i].style.top = top + "px";
					}
				} else {
					for (var i = 0; i < this._storage.pictures.length; i++) {
						this._storage.pictures[i].style.clear = "none";
						this._storage.pictures[i].first = false;
					}
					for (var i = 0; i < this._storage.pictures.length; i++) {
						this._storage.pictures[i].style.top = "0";
					}
					for (var i = 0; i < this._storage.pictures.length; i++) {
						this._storage.pictures[i].style.left = "0";
					}
					for (var i = 0; i < this._storage.pictures.length; i += columnCount) {
						this._storage.pictures[i].first = true;
					}
					for (var i = 0; i < this._storage.pictures.length; i++) {
						if (!this._storage.pictures[i].first) {
							this._storage.pictures[i].style.left = (parseInt(this._storage.pictures[i - 1].style.left.split("px")[0]) + this._storage.pictures[i - 1].offsetWidth + itemMargin) + "px";
						}
					}
					for (var i = 0; i < this._storage.pictures.length; i++) {
						if (this._storage.pictures[i + columnCount]) {
							this._storage.pictures[i + columnCount].style.top = ((this._storage.pictures[i].offsetTop + this._storage.pictures[i].offsetHeight + itemMargin) - (this._storage.pictures[i + columnCount].offsetTop)) + "px";
							if (!a) this._storage.chisel.top = this._storage.pictures[i + columnCount].style.top;
						}
					}
				}
				Pictre._settings.wrapper.parentNode.style.height = (Pictre._settings.wrapper.scrollHeight + itemMargin) + "px";
			}
		},
		client: {
			compatible: true,
			detect: function() {
				if (navigator.userAgent.indexOf("AppleWebKit") != -1) {
					if (navigator.userAgent.indexOf("Chrome") != -1) {
						this.name = "Chrome";
						this.id = 1;
					} else {
						if (navigator.userAgent.indexOf("Mobile") != -1) {
							this.name = "Mobile Safari";
							this.id = 3;
						} else {
							this.name = "Safari";
							this.id = 2;
							ver = navigator.userAgent.split("Version/");
							this.version = ver[1].split(" ")[0];
						}
					}
				} else {
					if (navigator.userAgent.indexOf("Firefox") != -1) {
						this.name = "Firefox";
						this.id = 4;
					} else if (navigator.userAgent.indexOf("Opera") != -1) {
						this.name = "Opera";
						this.id = 5;
					} else if (navigator.userAgent.indexOf("MSIE ") != -1) {
						if (navigator.userAgent.indexOf("Trident") != -1) {
							var nav = navigator.userAgent.split(";")[1];
							nav = parseInt(nav.split(" ")[2]);
							this.name = "Internet Explorer";
							this.version = nav;
							if (nav > 8) this.id = 6;
							else this.id = 7
						} else {
							this.name = "Internet Explorer";
							this.id = 8;
						}
					}
				}
				if (this.id >= 7) {
					var warning;
					var lock = false;
					var header = 'Sorry about that!';
					if (this.id > 7) {
						warning = "Unfortunately Pictre is not supported in your browser, please consider upgrading to Google Chrome, by clicking here, for an optimal browsing experience.";
						lock = true;
						Pictre.get.ui.warning.onclick = function() {
							window.open("http://chrome.google.com", "_blank");
						};
					} else {
						header = 'Notice!';
						warning = "Some of Pictre's features may not be fully supported in your browser.";
						Pictre.get.ui.warning.onclick = function() {
							this.remove();
						};
					}
					Pictre.client.compatible = false;
					Pictre.get.ui.warning.put({
						header: header,
						body: warning,
						locked: lock
					});
				}
			},
			id: null,
			name: 'Unknown',
			os: navigator.platform,
			online: navigator.onLine,
			version: null
		},
		create: {

			picture: function(a, b) {

				var self = Pictre;

				if (b) {
					Pictre._storage.upload.method = b;
				}

				var img = new Image();

				var pic = document.createElement("div");
				pic.id = 'pic' + a.id;

				if (!self.is.loaded && !b && Pictre._settings.wrapper.style.display != "none") Pictre._settings.wrapper.style.display = "none";

				img._onload = function(a) {

					if (b == "prepend" || b == "append") {

						if (b == "prepend") {
							Pictre.chisel();
						} else {

							Pictre._storage.data.loaded++;
							Pictre.chisel(Pictre._settings.data.anchor - Pictre._settings.data.limit.request - Pictre._storage.data.deleted - 1);

							if (Pictre._storage.data.loaded == Pictre._settings.data.limit.request) {
								// reset count for images that have loaded and indicate
								// that images have finished / are no longer loading
								Pictre._storage.data.loaded = 0;
								Pictre.is.loading = false;
							}

						}

					} else {

						self._storage.loaded++;

						if (self._storage.loaded == self._storage.pictures.length) {

							Pictre.get.ui.loader.put(1);

							Pictre._settings.wrapper.style.display = 'block';
							self._storage.loaded = 0;

							self.chisel();

							if (!self.is.loaded) {
								self.is.loaded = true;
								self._storage._loadonready.call(self);
							}

						} else {
							Pictre.get.ui.loader.put(self._storage.loaded / self._storage.pictures.length);
						}
					}
				};

				Pictre.extend(img).on('load', function() {

					pic.innerHTML = '';
					pic.appendChild(img);

					this._onload();

				});

				Pictre.extend(img).on('error', function() {

					var height = 137;
					var paddingTop = parseInt(window.getComputedStyle(pic).getPropertyValue('padding-top').split("px")[0]) + 1;
					var paddingBottom = parseInt(window.getComputedStyle(pic).getPropertyValue('padding-bottom').split("px")[0]);

					var errImg = new Image();
					errImg.src = '/static/i/Pictre-404.png';

					pic.innerHTML = '';
					pic.data.src = '/static/i/Pictre-404.full.png';
					pic.style.height = (height - paddingTop + paddingBottom * 2) + 'px';

					pic.appendChild(errImg);

					this._onload();

				});

				img.src = Pictre._settings.cloud.datadir + a.thumb;

				Pictre.extend(pic).on('click', function() {
					if (window.location.hash.split("#")[1] == this.data.dbid) {
						if (Pictre.client.id == 3 || window.innerWidth < Pictre._settings.minWidth) Pictre.spotlight.feature(this);
						else Pictre.gallery.feature(this);
					} else window.location.assign("#" + a.id);
				});
				pic.className = self.properties.className;
				pic.innerHTML = "loading...";
				pic.data = {
					author: a.author,
					comments: a.comments,
					date: a.time,
					dbid: a.id,
					id: null,
					prepend: false,
					src: Pictre._settings.cloud.datadir + a.src,
					thumb: Pictre._settings.cloud.datadir + a.thumb
				};

				if (b == "prepend") {
					pic.data.prepend = true;
				} else {
					pic.data.id = self._storage.iterator;
					self._storage.iterator++;
				}

				if (b == 'prepend') {
					self._storage.pictures.unshift(pic);
				} else {
					self._storage.pictures.push(pic);
				}

				if (self._settings.wrapper) {

					if (b == 'prepend') {
						self._settings.wrapper.insertBefore(pic, self._settings.wrapper.children[0]);
					} else {
						self._settings.wrapper.appendChild(pic);
					}

				}

				return pic;
			}
		},
		events: {
			_type: {},
			on: function(type, callback) {
				if (this._type.hasOwnProperty(type)) {
					this._type[type].push(callback);
				} else {
					var self = this;
					this._type[type] = [];
					Pictre.extend(window).on(type, function() {
						for (var i = 0; i < self._type[type].length; i++) {
							if (typeof self._type[type][i] == 'function') {
								self._type[type][i].call(this);
							}
						}
					});
					this.on(type, callback);
				}
			}
		},
		extend: function(dom) {
			return {
				on: function(type, callback) {
					try {
						dom.addEventListener(type, function(e) {
							if (typeof callback == 'function') callback.call(dom, e);
						});
					} catch (e) {
						dom.attachEvent('on' + type, function(e) {
							if (typeof callback == 'function') callback.call(dom, e);
						});
					}
				}
			};
		},
		get: {
			_data: null,
			all: function() {
				return Pictre._storage.pictures;
			},
			db: function(a, b) {
				var self = this;
				var settings = {
					album: false,
					resource: 'album',
					anchor: Pictre._settings.data.anchor,
					limit: Pictre._settings.data.limit.request
				};

				if (a) {
					if (typeof a == "object") {
						for (var i in a) {
							settings[i] = a[i];
						}
					} else settings.resource = a;
				}
				var album = settings.album === true && Pictre._settings.enableLock === true ? "&album=" + Pictre.board.get().toLowerCase() : "";
				var where = settings.where ? "&where=" + encodeURIComponent(settings.where) : "";
				if (Pictre.client.id > 5 || !Pictre.client.compatible) {
					if (window.XDomainRequest) {
						var xdr = new XDomainRequest();
						xdr.open("post", Pictre._settings.cloud.address + 'data.php');
						xdr.send("ie=true&type=get_data&request=" + settings.resource + where + "&anchor=" + settings.anchor + album + "&limit=" + settings.limit + "&ie=true");
						xdr.onload = function() {
							if (xdr.responseText == "NO_DATA") {
								console.log("no data");
								Pictre.get.ui.notice("No image data was returned by the server.");
							} else {
								self._data = JSON.parse(xdr.responseText);
								if (typeof b == "function") b.call(Pictre, self._data);
							}
						};
						xdr.onerror = function(error) {
							Pictre.get.ui.notice("There was an error processing the images.");
							console.log(error);
						};
					} else {
						$.support.cors = true;
						$.ajax({
							type: 'POST',
							url: Pictre._settings.cloud.address + 'data.php',
							async: true,
							crossDomain: true,
							data: {
								type: 'get_data',
								request: settings.resource,
								anchor: settings.anchor,
								limit: settings.limit,
								album: album,
								where: where,
								ie: Pictre.client.id > 5
							},
							success: function(data) {
								self._data = JSON.parse(data);
								if (typeof b == "function") b.call(Pictre, self._data);
							},
							error: function(error) {
								for (var i in error) {
									console.log(i + ":" + error[i]);
								}
								Pictre.get.ui.notice("Error processing data.");
								console.log(error);
							}
						});
					}
				} else {

					var xhr = new XMLHttpRequest();

					try {
						// "type=get_data&request="+settings.from+where+"&anchor="+settings.anchor+album+"&limit="+settings.limit
						xhr.open('GET', Pictre._settings.cloud.address + 'api/get/' + settings.resource + '/' + Pictre.board.get().toLowerCase() + '/' + settings.anchor + '/' + settings.limit, true);
						// xhr.open("POST",Pictre._settings.cloud.address+'data.php',true);
					} catch (e) {
						console.log(e);
						Pictre.get.ui.notice("Reverting to compatibility mode for older browsers.");
						Pictre.client.compatible = false;
						self.db(settings, b);
					}

					xhr.send(null);
					Pictre.extend(xhr).on('readystatechange', function() {

						if (xhr.readyState == 4 && xhr.status == 200) {

							try {

								self._data = JSON.parse(xhr.responseText);

								if (typeof b == "function") {
									b.call(Pictre, self._data);
								}

							} catch (e) {

								console.log(e);
								console.log(xhr.responseText);

								var message = 'Pictre is down for server maintenance. Service will resume shortly.';

								Pictre.get.ui.notice('Pictre is unable to load album data at this moment.');
								Pictre.get.ui.warning.put({

									body: message,
									header: 'Updates in progress!',
									icon: null,
									locked: true

								});

							}

						}
					});
				}
			},
			hash: function() {
				if (window.location.hash) {
					var id = window.location.hash.split("#")[1];
					var pic = document.getElementById("pic" + id);
					if (Pictre.gallery.is.featuring) {
						if (pic) Pictre.gallery.overlay.replaceImage({
							object: pic
						});
						else Pictre.gallery.overlay.exit();
					} else {
						if (window.innerWidth < Pictre._settings.minWidth || Pictre.client.id == 3) {
							if (pic) {
								Pictre.spotlight.feature(pic);
							}
						} else {
							if (pic) Pictre.gallery.feature(pic);
						}
					}
				} else {
					if (Pictre.is.spotlight) Pictre.spotlight.remove(), Pictre.get.ui.menu.removeButton('back');
					else if (Pictre.gallery.is.featuring && !Pictre.gallery.is.warning) Pictre.gallery.overlay.exit();
				}
			},
			picture: function(a) {
				return Pictre._storage.pictures[a];
			},
			total: function() {
				return Pictre._storage.pictures.length;
			},
			ui: {
				home: {
					wrapper: null,
					position: function() {
						if (window.innerWidth < 500) {
							this.wrapper.style.width = (window.innerWidth - 2) + "px";
							this.wrapper.style.left = 0;
						} else {
							this.wrapper.style.width = "65%";
							this.wrapper.style.left = (window.innerWidth / 2 - this.wrapper.clientWidth / 2) + "px";
						}
						this.wrapper.style.top = "80px";
					},
					put: function(a) {
						if (this.wrapper) this.remove();
						var self = this;
						var container = document.createElement("div");
						container.className = "Pictre-home-container";
						var input = document.createElement("input");
						input.type = "text";
						input.placeholder = "Enter an album's name";
						input.autofocus = true;
						input.id = "Pictre-album-input";
						Pictre.extend(input).on("keydown", function(e) {
							if (e.keyCode == 13) {
								var val = this.value.toLowerCase().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
								if (Pictre._settings.pages.restricted.indexOf(this.value.toLowerCase()) == -1) {
									if (this.value.match(/[^a-z0-9\-\.\+\_\ ]/gi)) {
										Pictre.get.ui.notice("Your album name contains invalid characters.");
									} else {
										if (this.value.match(/[\ ]/g)) Pictre.get.ui.notice("Your album name cannot contain spaces.");
										else window.location.assign(Pictre._settings.app.address + val);
									}
								} else {
									this.value = "";
									Pictre.get.ui.notice("That album is restricted, please try another.");
								}
							}
						});
						var p = document.createElement("p");
						if (Pictre.client.id == 5) input.removeAttribute('autofocus');
						if (Pictre.client.name == "Internet Explorer" || Pictre.client.id == 3 || (Pictre.client.id == 2 && Pictre.client.version.indexOf("5.1.") != -1)) {
							input.placeholder = "";
							var val = "Enter an album's name";
							input.value = val;
							input.removeAttribute('autofocus');
							Pictre.extend(input).on('focus', function() {
								if (this.value == val) this.value = '';
							});
							Pictre.extend(input).on('blur', function() {
								if (this.value == '') this.value = val;
							});
						}
						this.wrapper = document.createElement("span");
						this.wrapper.className = "Pictre-home-wrapper";
						p.appendChild(input);
						container.appendChild(p);
						this.wrapper.appendChild(container);
						if (a) a.appendChild(this.wrapper);
						Pictre.events.on('resize', function() {
							self.position();
						});
						this.wrapper.appendTo = function(b) {
							b.appendChild(this);
							self.position();
							return this;
						};
						return this.wrapper;
					},
					remove: function() {
						if (this.wrapper) document.body.removeChild(this.wrapper);
					}
				},
				splash: {
					div: {
						_init: false,
						wrapper: null
					},
					put: function(a) {
						if (!this.div._init) {
							this.div._init = true;
							this.div.wrapper = document.createElement('div');
							this.div.wrapper.className = 'Pictre-splash-wrapper';
							this.div.wrapper.style.zIndex = "998";
							document.body.appendChild(this.div.wrapper);
						}
						if (!Pictre.gallery.is.featuring) {
							Pictre.get.ui.passcode.put('splash', a); ////--
						} else {
							Pictre.gallery.overlay.onexit(function() {
								Pictre.get.ui.splash.put(a);
							});
						}
						document.body.style.overflow = "hidden";
					}
				},
				imageOptions: {

					div: null,

					hide: function() {
						if (this.div) {
							this.is.hidden = true;
							this.div.style.display = "none";
						}
					},
					is: {
						active: false,
						disabled: false,
						hidden: false
					},
					options: {

						delete: {

							optionIcon: 'fa-trash',
							optionColor: 'rgb(135,0,0)',

							onclick: function() {

								Pictre.terminal.parse({

									id: Pictre.gallery.overlay.img.data.dbid,
									src: Pictre.gallery.overlay.img.data.src,
									thumb: Pictre.gallery.overlay.img.data.thumb,
									command: "/Pictre delete"

								}, function(data) {

									if (data.error) {
										//what to do after deletion...
									}

								});
							}

						}

					},

					put: function(a) {

						if (!this.is.disabled) {

							var self = this;

							if (this.div) {

								this.is.hidden = false;
								this.div.style.display = "block";

							} else {

								this.is.active = false;

								this.div = document.createElement("div");
								this.div.className = "Pictre-overlay-pic-options";
								this.div.innerHTML = '<span class="fa fa-bars fa-2x"></span>';

								this.div.optionsWrapper = document.createElement("div");
								this.div.optionsWrapper.className = "Pictre-overlay-pic-options-wrapper";

								this.div.optionsWrapper.innerWrapper = document.createElement("ul");

								for (var i in this.options) {

									var li = document.createElement("li");
									li.key = i;
									li.innerHTML = '<span class="fa ' + (self.options[i].optionIcon || 'fa-wrench') + '"></span> ' + i;

									if (self.options[i].optionColor) {
										li.style.color = self.options[i].optionColor;
									}

									this.div.optionsWrapper.innerWrapper.appendChild(li);

									if (this.options[i]) {

										Pictre.extend(li).on('click', function() {
											self.options[this.key].onclick.call(self);
										});

									}

								}

								Pictre.extend(this.div.optionsWrapper).on('click', function(e) {
									e.stopPropagation();
								});

								Pictre.extend(this.div).on('click', function(e) {

									e.stopPropagation();

									if (self.is.active) {

										self.is.active = false;
										this.optionsWrapper.style.display = "none";

									} else {

										self.is.active = true;
										this.optionsWrapper.style.display = "block";

										self.position(a);

									}
								});

								this.div.optionsWrapper.appendChild(this.div.optionsWrapper.innerWrapper);
								a.appendChild(this.div);
								a.appendChild(this.div.optionsWrapper);
								this.div.optionsWrapper.style.top = this.div.clientHeight + "px";
								this.position(a);
								Pictre.events.on('resize', function() {
									self.position(a);
								});
							}
						}
					},
					position: function(a) {
						var optionsWrapperWidth = ((-this.div.optionsWrapper.clientWidth / 2) + this.div.clientWidth / 2);
						if (-optionsWrapperWidth > (window.innerWidth - a.clientWidth) / 2) {
							optionsWrapperWidth += (-optionsWrapperWidth - (window.innerWidth - a.clientWidth) / 2);
							if (optionsWrapperWidth > 0) optionsWrapperWidth = 0;
						}
						this.div.optionsWrapper.style.right = optionsWrapperWidth + "px";
					}
				},
				loader: {
					div: null,
					put: function(a) {
						var self = this;
						var p = a * 100;
						if (!self.div) {
							self.div = document.createElement("div");
							self.div.progress = document.createElement("div");
							self.div.progress.className = "Pictre-loader-progress";
							self.div.className = "Pictre-loader-wrapper";
							self.div.appendChild(self.div.progress);
							document.body.appendChild(self.div);
							self.position();
							Pictre.events.on('resize', function() {
								self.position();
							});
						}
						$(self.div.progress).width(Math.max(p, 0) + '%');
						if (a == 1) self.remove();
					},
					position: function() {
						var self = this;
						var offset = Pictre.get.ui.menu._div.clientHeight + Pictre._storage.data.totalDiv.parentNode.clientHeight;
						self.div.style.top = (($(window).height() + offset) / 2 + self.div.clientHeight / 2) + "px";
						self.div.style.left = ($(window).width() / 2 - self.div.clientWidth / 2) + "px";
					},
					remove: function() {
						if (this.div) document.body.removeChild(this.div);
					}
				},
				menu: {

					_div: null,
					buttons: {},

					addButton: function(a) {

						var buttonIconClassName = 'fa-cloud';

						this.buttons[a.name] = document.createElement("div");
						this.buttons[a.name].id = a.id;
						this.buttons[a.name].className = "top-button"; //"top-button";
						this.buttons[a.name].title = a.title;

						// handle button icon type
						if (a.id == 'upload') {
							// assign upload icon
							buttonIconClassName = 'fa-cloud-upload';
						} else if (a.id == 'lock') {
							// assign 'lock' icon to indicate signing in
							buttonIconClassName = 'fa-lock';
						} else if (a.id == 'unlock') {
							// assign 'unlock' icon to indicate signing out
							buttonIconClassName = 'fa-unlock';
						} else if (a.id == 'back') {
							// assign 'back' arrow icon to indicate returning to album
							buttonIconClassName = 'fa-arrow-left';
						}

						this.buttons[a.name].innerHTML = '<span class="fa ' + buttonIconClassName + ' fa-2x"></span>';

						this._div.appendChild(this.buttons[a.name]);

						this.buttons[a.name].style.top = (this.buttons[a.name].parentNode.clientHeight / 2 - this.buttons[a.name].clientHeight / 2) + 'px';

						// declare 'on' function to allow addition of event listener to element
						this.buttons[a.name].on = function(a, b) {

							Pictre.extend(this).on(a, function(e) {
								b.call(this, e);
							});

							return this;

						};

						return this.buttons[a.name];
					},

					getButton: function(a) {
						return this.buttons[a];
					},

					hasButton: function(a) {
						var r = false;
						if (this.buttons.hasOwnProperty(a)) r = true;
						return r;
					},
					hideButton: function(a) {
						this.buttons[a].style.display = "none";
					},
					put: function(a, b) {
						this._div = document.createElement("div");
						this._div.id = "top";
						var brand = document.createElement("div");
						brand.id = "brand";
						brand.innerHTML = Pictre._settings.app.title;
						Pictre.extend(brand).on('click', function() {
							window.location.href = Pictre._settings.app.address;
						});
						this._div.appendChild(brand);
						if (b) a.insertBefore(this._div, b);
						else a.appendChild(this._div);
						brand.style.top = (this._div.clientHeight / 2 - brand.clientHeight / 2) + "px";
						return this._div;
					},
					removeButton: function(a) {
						if (this.buttons.hasOwnProperty(a)) this._div.removeChild(this.buttons[a]), delete this.buttons[a];
					},
					showButton: function(a) {
						this.buttons[a].style.display = "block";
					}
				},
				passcode: {
					div: null,
					input: function(a) {
						var self = this;
						this.div = document.createElement("input");
						this.type = "text";
						this.password = false;
						this.className = "Pictre-passcode-input";
						this.placeholder = "Create a passcode";
						this.value = a;
						this.create = function(b) {
							if (this.value == '_blank') this.value = '';
							else if (!this.value) this.value = this.placeholder;
							this.div.maxLength = 10;
							this.div.className = this.className;
							this.div.type = this.type;
							this.div.placeholder = this.placeholder || "";
							this.div.value = b || this.value || "";
							Pictre.extend(this.div).on('focus', function(e) {
								if (self.password) self.div.type = "password";
								if (self.div.value == self.value) self.div.value = "";
							});
							Pictre.extend(this.div).on('blur', function() {
								if (self.div.value == "" && b != '') self.div.value = self.value;
							});
							this.div.on = function(b, c) {
								Pictre.extend(this).on(b, function(e) {
									c.call(self, e);
								});
								return this;
							};
							return this.div;
						}
					},
					put: function(a, b) {
						var self = this;
						self.div = null;
						if (Pictre.gallery.is.featuring) {
							while (Pictre.gallery.overlay.div.hasChildNodes()) {
								Pictre.gallery.overlay.div.removeChild(Pictre.gallery.overlay.div.lastChild);
							}
						}
						if (!self.div) {

							var p = document.createElement("div");
							p.className = "Pictre-passcode-p";

							if (a == 'create') {
								p.innerHTML = "Congratulations! You have found a new album, create a passcode below to claim it as your own!";
							} else {
								p.innerHTML = "To proceed, enter the passcode for this album below.";
							}

							if (a == 'create') {

								Pictre._storage.overlay.locked = true;

								var inp1 = new self.input("Create a passcode");
								var inp2 = new self.input("Verify passcode");
								inp2.placeholder = "Confirm your passcode";

								inp1.create().on('keydown', function(e) {

									if (e.keyCode == 13) {

										if (inp2.div.value != "" && inp2.div.value != inp2.value) {
											self.submit([inp2.div, inp1.div], "passcode_set", _onsubmit);
										} else {
											inp2.div.focus();
										}

									}

								});

								inp2.create().on('keydown', function(e) {

									if (e.keyCode == 13) {

										if (inp1.div.value != "" && inp1.div.value != inp1.value) {
											self.submit([inp2.div, inp1.div], "passcode_set", _onsubmit);
										} else {
											inp1.div.focus();
										}

									}

								});

							} else if (a == 'splash') {

								var c = document.createElement('div');
								c.className = 'Pictre-passcode-p Pictre-passcode-formal-font';
								c.style.fontSize = "0.85em";
								c.style.display = "none";

								Pictre._storage.overlay.locked = true;

								p.style.fontSize = "0.85em";
								p.innerHTML = "<b class='brand' style='width:100%;text-align:center;font-size:2.2em;display:block;margin-bottom:10px;'>Pictre</b>";
								p.innerHTML += "<b class='brand'>Pictre</b> <span>is a collection of cloud photo albums. You can view or create picture albums based on interests, people, or families. </span>";
								p.innerHTML += "<span>To get started, simply type an album name below.</span>";

								if (b) {
									Pictre.get.ui.notice(b, 'splash', c); ////--
								}

								var inp1 = new self.input('_blank');
								inp1.div.style.color = "white";

								inp1.create('').on('keydown', function(e) {

									if (e.keyCode == 13) {

										if (this.div.value != "" && this.value != this.div.value) {

											var val = this.div.value.toLowerCase().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

											if (Pictre._settings.pages.restricted.indexOf(val) == -1) {

												if (this.div.value.match(/[^a-z0-9\-\.\+\_\ ]/gi)) {
													Pictre.get.ui.notice("Your album name contains invalid characters.", 'splash', c);
												} else {
													if (this.div.value.match(/[\ ]/g)) Pictre.get.ui.notice("Your album name cannot contain spaces.", 'splash', c);
													else window.location.assign(Pictre._settings.app.address + val);
												}

											} else {
												this.div.value = '';
												Pictre.get.ui.notice("That album is restricted, please try another.", 'splash', c);
											}

										}

									}

								}).on('click', function(e) {
									e.stopPropagation();
								});

								inp1.div.setAttribute('maxlength', 100);
								if (Pictre.client.name == "Internet Explorer" || Pictre.client.id == 3 || (Pictre.client.id == 2 && Pictre.client.version.indexOf("5.1.") != -1)) {
									var val = "Enter an album's name";
									inp1.div.placeholder = "";
									inp1.div.value = val;
									inp1.div.nofocus = true;
									Pictre.extend(inp1.div).on('focus', function() {
										if (this.value == val) this.value = '';
									});
									Pictre.extend(inp1.div).on('blur', function() {
										if (this.value == '') this.value = val;
									});
								} else {
									inp1.div.placeholder = "Enter an album name";
								}
							} else {
								Pictre._storage.overlay.locked = false;
								var inp1 = new self.input();
								inp1.placeholder = "Enter your passcode";
								inp1.password = true;
								inp1.create().on('keydown', function(e) {
									if (e.keyCode == 13) {
										if (this.div.value != "" && this.value != this.div.value) self.submit([this.div], "board_unlock", function(data) {
											if (data == "success") {
												Pictre.board.set.state(2);
												Pictre._storage.overlay.locked = false;
												Pictre._settings.allowUploads = true;
												self.remove();
												Pictre.gallery.overlay.div.click();
											} else {
												self.div.contentWrapper.innerHTML = "<p>Wrong passcode, please try again.</p>";
												setTimeout(function() {
													self.remove();
													self.put();
												}, 2000);
											}
										});
									}
								}).on('click', function(e) {
									e.stopPropagation();
								});
							}
							self.div = document.createElement("div");
							self.div.className = "Pictre-passcode-wrapper";
							self.div.contentWrapper = document.createElement("div");
							self.div.contentWrapper.className = "Pictre-passcode-input-wrapper";
							self.div.contentWrapper.appendChild(p);
							if (c) self.div.contentWrapper.appendChild(c);
							self.div.contentWrapper.appendChild(inp1.div);
							if (a == 'create') self.div.contentWrapper.appendChild(inp2.div);
							self.div.appendChild(self.div.contentWrapper);
							if (Pictre.gallery.is.featuring) Pictre.gallery.overlay.div.appendChild(self.div);
							else Pictre.gallery.overlay.put().appendChild(self.div);
							Pictre.extend(self.div.contentWrapper).on('click', function(e) {
								e.stopPropagation();
							});
							Pictre.events.on('resize', function() {
								self.position();
							});

							function _onsubmit(a) {
								if (a == "success") {
									Pictre.board.set.state(1);
									Pictre._storage.overlay.locked = false;
									Pictre._settings.allowUploads = true;
									self.remove();
									Pictre.gallery.overlay.div.click();
								} else {
									console.log(a);
									self.div.contentWrapper.innerHTML = "<p>There was an error saving your passcode, please try again later!</p>";
									setTimeout(function() {
										self.remove();
										self.put();
									}, 2000);
								}
							};
						}
						if (!inp1.div.nofocus) inp1.div.focus();
						self.position();
					},
					position: function() {
						var self = this;
						if (self.div) {
							self.div.style.left = ($(window).width() / 2 - self.div.clientWidth / 2) + "px";
							self.div.style.top = ($(window).height() / 2 - self.div.offsetHeight / 2) + "px";
							self.div.contentWrapper.style.left = (self.div.clientWidth / 2 - self.div.contentWrapper.clientWidth / 2) + "px";
							self.div.contentWrapper.style.top = (self.div.clientHeight / 2 - self.div.contentWrapper.offsetHeight / 2) + "px";
						}
					},
					remove: function() {
						Pictre.gallery.overlay.div.removeChild(this.div);
						this.div = null;
					},
					submit: function(a, b, c) {
						if ((b == "passcode_set" && a[0].value == a[1].value) || (b == "board_unlock" && a[0].value)) {
							this.div.contentWrapper.innerHTML = "<p>loading, please wait...</p>";
							var xhr = new XMLHttpRequest();
							xhr.open('POST', Pictre._settings.cloud.address + "data.php", true);
							xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
							xhr.send("type=" + b + "&passcode=" + a[0].value + "&album=" + Pictre.board.get().toLowerCase());
							Pictre.extend(xhr).on('readystatechange', function() {
								if (xhr.readyState == 4 && xhr.status == 200) {
									if (typeof c == "function") c.call(this, xhr.responseText);
								}
							});
						} else this.div.contentWrapper.children[0].innerHTML = "Your passcodes do not match, please try again.";
						this.position();
					}
				},
				notice: function(a, b, c) {

					if (b == 'splash' && c) {

						c.style.display = 'block';
						c.innerHTML = a;

						if (c.timeout) {
							clearTimeout(c.timeout);
						}

						c.timeout = setTimeout(function() {
							c.style.display = 'none';
						}, 10000);

					} else {

						var a = a || "Untitled notice";
						var note = document.createElement("div");
						var oldnote = $('.Pictre-notice');

						if (oldnote.length) {
							document.body.removeChild(oldnote[0]);
						}


						note.className = "Pictre-notice";
						note.innerHTML = a;

						Pictre._storage.data.totalDiv = document.createElement("div");
						Pictre._storage.data.totalDiv.className = "Pictre-notice-extra";

						if (Pictre.board.exists) {

							Pictre._storage.data.totalDiv.innerHTML = b || 0;
							Pictre._storage.data.totalDiv.title = "There are " + Pictre._storage.data.totalDiv.innerHTML + " pictures in this album";

						}

						note.appendChild(Pictre._storage.data.totalDiv);
						document.body.appendChild(note);

						if (Pictre._settings.wrapper) {
							Pictre._settings.wrapper.style.marginTop = "52px";
						}
					}
				},

				upload: {

					div: null,
					response: null,

					put: function() {

						var self = this;

						this.div = document.createElement("div");
						this.div.className = "Pictre-upload";

						Pictre.extend(Pictre.gallery.overlay.put().appendChild(this.div)).on('click', function(e) {

						});

						this.position();

						Pictre.events.on('resize', function() {
							self.position();
						});

						var color = {

							inactive: 'rgba(105,105,105,0.3)',
							extract: 'rgb(151,125,4)',
							pending: 'rgb(222,222,222)',
							warning: 'rgb(86,35,9)',
							success: 'rgb(23,68,20)'

						};

						var header = document.createElement("div");
						header.className = "Pictre-upload-header";
						header.innerHTML = "Upload";
						header.style.zIndex = "99";

						var input = document.createElement("input");
						input.type = "file";
						input.name = "images[]";
						input.multiple = true;
						input.style.position = "absolute";
						input.style.top = "0";
						input.style.zIndex = "-1";
						input.style.opacity = "0";

						var p = document.createElement("p");
						var p_text = document.hasOwnProperty("ondragover") ? "Drag and drop your files here. Or simply, click to select files from your device." : "Click here to select files from your device.";

						p.innerHTML = p_text;

						var shader = document.createElement("div");
						shader.className = "Pictre-upload-area-shader";

						shader.appendChild(p);

						var progress = document.createElement("div");
						progress.className = "Pictre-upload-area-progress";

						var area = document.createElement("div");
						area.className = "Pictre-upload-area";

						area.appendChild(shader);
						area.appendChild(progress);
						area.appendChild(header);

						this.div.appendChild(area);
						this.div.appendChild(input);

						area.style.marginLeft = (-area.clientWidth / 2) + 'px';
						area.style.marginTop = (-area.clientHeight / 2 + 20) + 'px';

						header.style.top = (-area.clientHeight / 4 - 15) + 'px';

						progress.style.height = (area.clientHeight) + 'px';

						if (Pictre._settings.demo.upload) {

							console.log("Warning: upload demo active.");

							area.locked = true;
							progress.style.borderColor = color.pending;

							(function demo(n, t) {

								if (t) {
									clearTimeout(t);
								}

								t = setTimeout(function() {

									progress.style.width = (n * 100) + '%';
									n += 0.002;

									if (n >= 0.995) {
										n = 0;
									}

									demo(n, t);

								}, 1000 / 60);

							})(0);
						}

						Pictre.extend(this.div).on('dragover', function(e) {

							e.preventDefault();

							if (!area.locked) {
								area.style.borderColor = "rgba(222,222,222,0.34)";
							}

						});

						Pictre.extend(input).on('click', function(e) {
							e.stopPropagation();
						});

						Pictre.extend(shader).on('click', function(e) {

							e.stopPropagation();

							// if the upload area is not busy, trigger click
							// event on file input element
							if (!area.locked) {
								input.click();
							}

						});

						Pictre.extend(this.div).on('drop', function(e) {

							e.preventDefault();
							render(e.dataTransfer.files, upload);

							area.style.borderColor = color.inactive;

						});

						if (Pictre.client.id == 5) {
							// fix for opera browsers
							area.ondrop = function() {};
						}

						Pictre.extend(input).on('change', function() {
							// if there have been files selected by the user,
							// trigger upload of files
							if (input.files.length) {
								render(input.files, upload);
							}

						});

						function render(f, b) {

							if (!area.locked) {

								area.locked = true;

								var i = 0;
								var exif = [];

								progress.style.width = "0";
								progress.style.borderColor = color.pending;

								read();

								function read() {

									var kind = f[i].type.split("/");

									if (kind[0] == "image") {

										var reader = new FileReader;
										reader.readAsBinaryString(f[i]);

										reader.onloadend = function() {

											exif[i] = new EXIF.readFromBinaryFile(new BinaryFile(this.result));
											next();

										};

									} else {
										next();
									}
								}

								function next() {

									i++;

									progress.style.width = (i / f.length * 100) + "%";

									p.innerHTML = "Analyzing image data " + parseInt(i / f.length * 100) + "%";

									if (i == f.length) {

										area.locked = false;

										for (var x = 0; x < f.length; x++) {
											f[x].exif = exif[x];
										}

										if (typeof b == "function") {
											b.call(Pictre, f);
										}

									} else {
										read();
									}
								}
							}
						}

						function upload(f) {
							if (!area.locked) {
								Pictre._storage.overlay.locked = true;
								var files = [];
								if (!Pictre._storage.upload.overflow) {
									if (f.length > Pictre._settings.uploadLimit) {
										Pictre._storage.upload.overflow = [];
										for (var i = 0; i < Pictre._settings.uploadLimit; i++) {
											files.push(f[i]);
										}
										for (var i = Pictre._settings.uploadLimit; i < f.length; i++) {
											Pictre._storage.upload.overflow.push(f[i]);
										}
									} else {
										files = f;
									}
								} else {
									var lim = Pictre._storage.upload.overflow.length - Pictre._storage.upload.offset > Pictre._settings.uploadLimit ? Pictre._settings.uploadLimit + Pictre._storage.upload.offset : Pictre._storage.upload.overflow.length;
									for (var i = Pictre._storage.upload.offset; i < lim; i++) {
										files.push(Pictre._storage.upload.overflow[i]);
									}
									var num = Pictre._storage.upload.overflow.length - Pictre._storage.upload.offset > Pictre._settings.uploadLimit ? Pictre._settings.uploadLimit : Pictre._storage.upload.overflow.length - Pictre._storage.upload.offset;
									Pictre._storage.upload.offset += num;
								}
								area.locked = true;
								progress.style.borderColor = color.pending;
								progress.style.width = "0";
								if (files.length == 1) {
									p.innerHTML = "Uploading " + files[0].name + "...";
								} else {
									if (Pictre._storage.upload.overflow) {
										var offset = Pictre._storage.upload.offset >= Pictre._storage.upload.overflow.length + Pictre._settings.uploadLimit ? Pictre._storage.upload.offset : Pictre._storage.upload.offset + Pictre._settings.uploadLimit;
										p.innerHTML = "Uploading " + (offset) + " of " + (Pictre._storage.upload.overflow.length + Pictre._settings.uploadLimit) + " images...";
									} else {
										p.innerHTML = "Uploading " + files.length + " images...";
									}
								}

								var post = self.post(files, function(e) {

									if (e.response == 'success') {

										Pictre._storage.overlay.locked = false;

										if (e.ignored.length > 0) {

											if (!e.pending.length) {

												if (Pictre._storage.upload.overflow) {

													if (Pictre._storage.upload.offset >= Pictre._storage.upload.overflow.length) {

														Pictre._storage.upload.overflow = null;
														Pictre._storage.upload.offset = 0;
														p.innerHTML = 'Your last ' + Pictre._settings.uploadLimit + ' images could not be uploaded because none of their file types are supported.';

													} else {

														area.locked = false;
														Pictre._storage.overlay.locked = true;
														p.innerHTML = 'Images ' + (Pictre._storage.upload.offset - Pictre._settings.uploadLimit) + ' through ' + Pictre._storage.upload.offset + ' could not be uploaded because none of them were supported files... Preparing next batch of images for upload...';

														upload();

													}

												} else {
													p.innerHTML = 'None of the files were uploaded because none of them were supported images...';
												}

											} else {

												progress.style.borderColor = color.inactve;

												if (Pictre._storage.upload.overflow) {

													if (Pictre._storage.upload.offset >= Pictre._storage.upload.overflow.length) {

														Pictre._storage.upload.overflow = null;
														Pictre._storage.upload.offset = 0;
														p.innerHTML = "Hey! only " + e.pending.length + " of your last " + Pictre._settings.uploadLimit + " images were uploaded because " + e.ignored.length + " of them are not supported...";

													} else {

														area.locked = false;
														Pictre._storage.overlay.locked = true;
														p.innerHTML = "Hey! only " + e.pending.length + " of your images were uploaded because " + e.ignored.length + " of them are not supported... Preparing next batch of images for upload";

														upload();

													}

												} else {
													p.innerHTML = "Hey! " + e.ignored.length + " of your images could not be uploaded because they are not supported! Don't worry though, the rest were uploaded just fine.";
												}
											}
										} else {

											progress.style.borderColor = color.pending;

											if (Pictre._storage.upload.overflow) {

												if (Pictre._storage.upload.offset >= Pictre._storage.upload.overflow.length) {

													Pictre._storage.upload.overflow = null;
													Pictre._storage.upload.offset = 0;

													p.innerHTML = "Yay! All of your images have been uploaded!";

												} else {

													area.locked = false;
													Pictre._storage.overlay.locked = true;
													p.innerHTML = "Preparing next set of images for upload...";

													upload();

												}

											} else {
												p.innerHTML = "Yay! All of your images have been uploaded!";
											}
										}

										if (e.pending.length) {

											Pictre.get.db({

												limit: e.pending.length,
												anchor: 0

											}, function(data) {

												// if we are in developing mode, do not
												// attach 'uploaded' images to the board
												if (!Pictre.is.production) {
													return false;
												}

												Pictre.load(data, {
													method: 'prepend'
												});

											});

										}

									} else if (e.response == "timeout") {

										progress.style.borderColor = color.inactive;
										p.innerHTML = "Attempting to retrieve uploaded images, please wait...";
										Pictre.get.db({
											from: 'all',
											where: Pictre._settings.data.condition,
											anchor: 0,
											limit: Pictre._settings.data.limit.pageload
										}, function(data) {

											Pictre._storage.overlay.locked = false;
											p.innerHTML = "Hey! Pictre encountered a problem and could not finish uploading some of your files, sorry about that!";
											Pictre.load(data);

										});

									} else if (e.response == 'NO_DATA') {
										p.innerHTML = 'Pictre encountered a problem uploading one or more images. Make sure all of the files you are trying to upload are under 10M and try again.';
										Pictre._storage.overlay.locked = false;
									} else {
										p.innerHTML = e.response;
									}

									area.locked = false;
								});

								if (post) {

									Pictre.extend(post.upload).on('progress', function(byteStream) {

										if (!area.locked) {
											area.locked = true;
										}

										if (byteStream.lengthComputable) {
											progress.style.width = parseInt(byteStream.loaded / byteStream.total * 100) + "%";
										}

									});

									Pictre.extend(post.upload).on('load', function() {

										area.locked = true;
										p.innerHTML = 'Moving images into place...';

									});

									Pictre.extend(post.upload).on('error', function() {

										area.locked = false;

										Pictre._storage.overlay.locked = false;
										Pictre._storage.upload.overflow = null;
										Pictre._storage.upload.offset = 0;

										p.innerHTML = "There was an error uploading your images! Don't worry though, it's not your fault.";

									});

								} else {

									area.locked = false;

									Pictre._storage.overlay.locked = false;
									Pictre._storage.upload.overflow = null;
									Pictre._storage.upload.offset = 0;

									p.innerHTML = "No files were uploaded because none of the files you are trying to upload are images...";

								}

							}
						}

					},
					position: function() {
						if (this.div) {
							this.div.style.left = ($(window).width() / 2 - (this.div.clientWidth / 2)) + "px";
							this.div.style.top = ($(window).height() / 2 - (this.div.clientHeight / 2)) + "px";
						}
					},
					post: function(a, b) {

						var Files = {
							allowed: ['jpeg', 'png', 'gif'],
							ignored: [],
							pending: [],
							response: null,
							total: a
						};

						for (var i = 0; i < a.length; i++) {
							var kind = a[i].type.split("/");
							if (kind[0] == "image" && Files.allowed.indexOf(kind[1]) != -1) {
								Files.pending.push(a[i]);
							} else {
								Files.ignored.push(a[i]);
							}
						}

						if (Files.pending.length) {
							var data = new FormData();
							for (var i = 0; i < Files.pending.length; i++) {
								data.append(i, Files.pending[i]);
								if (Files.pending[i].exif) data.append("exif" + i, JSON.stringify(Files.pending[i].exif));
								data.append("album" + i, encodeURIComponent(Pictre._settings.data.album));
							}
							data.append("board", Pictre.board.get());
							this.response = Files;
							var xhr = new XMLHttpRequest();
							xhr.open("POST", Pictre._settings.cloud.address + 'data.php', true);
							Pictre.extend(xhr.upload).on("progress", function() {});
							xhr.send(data);
							Pictre.extend(xhr).on('readystatechange', function() {
								var call = false;
								if (xhr.status == 200 && xhr.readyState == 4) {
									Files.response = xhr.responseText;
									call = true;
								} else if (xhr.status == 504) {
									Files.response = "timeout";
									call = true;
								}

								if (typeof b == "function" && call) b.call(this, Files);
							});
							return xhr;
						} else {
							return false;
						}
					},
					remove: function() {
						Pictre.gallery.overlay.div.removeChild(this.div);
						this.div = null;
					}
				},

				warning: {

					div: null,
					response: null,

					put: function(a) {

						var self = this;
						var settings = {

							body: 'An error has occurred, don\'t worry though, it\'s not your fault!',
							dropzone: false,
							header: 'Hey!',
							icon: null,
							locked: false,
							style: true

						};

						if (a) {

							for (var i in a) {
								settings[i] = a[i];
							}

						}

						if (Pictre.gallery.is.featuring && settings.locked) {
							Pictre._storage.overlay.locked = false;
							Pictre.gallery.overlay.exit();
						}

						this.div = document.createElement("div");
						this.div.className = "Pictre-upload Pictre-warning";

						Pictre.gallery.is.warning = true;

						Pictre.extend(Pictre.gallery.overlay.put().appendChild(this.div)).on('click', function(e) {
							e.stopPropagation();
						});

						this.position();

						Pictre.events.on('resize', function() {
							self.position();
						});

						var header = document.createElement("div");
						header.className = "Pictre-upload-header";
						header.innerHTML = settings.header;
						header.style.zIndex = "999";

						var p = document.createElement("p");
						p.className = "Pictre-warning-p";
						p.innerHTML = settings.body || "Untitled text";

						this.div.appendChild(header);

						if (settings.dropzone) {
							var shader = document.createElement("div");
							shader.className = "Pictre-upload-area-shader";
							shader.appendChild(p);
							var area = document.createElement("div");
							area.className = "Pictre-upload-area";
							area.appendChild(shader);
							this.div.appendChild(area);
							area.style.marginLeft = (-area.clientWidth / 2) + "px";
							area.style.marginTop = (-area.clientHeight / 2 + 20) + "px";
						} else {
							// not upload interface, warning ui instead
							this.div.appendChild(p);
							p.style.marginTop = ((this.div.clientHeight - header.clientHeight) / 2 - (p.clientHeight / 2)) + "px";

							header.style.top = (-p.clientHeight) + 'px';
						}

						if (settings.icon) {

							var icon = document.createElement("img");
							icon.src = settings.icon;
							icon.style.display = "block";
							icon.style.margin = "20px auto 0 auto";

							p.appendChild(icon);

						}

						if (settings.locked) {
							Pictre._storage.overlay.locked = true;
						}

						if (typeof this.onclick == 'function') {

							if (settings.dropzone) {

								Pictre.extend(area).on('click', function() {
									self.onclick();
								});

							} else {

								Pictre.extend(this.div).on('click', function() {
									self.onclick();
								});

							}

						}
					},

					onclick: null,

					position: function() {
						if (this.div) {
							this.div.style.left = Math.max($(window).width() / 2 - (this.div.clientWidth / 2), 0) + "px";
							this.div.style.top = Math.max(($(window).height() / 2 - (this.div.clientHeight / 2)), 0) + "px";
						}
					},

					remove: function() {
						Pictre.gallery.is.warning = false;
						Pictre.gallery.overlay.exit();
						this.div.parentNode.removeChild(this.div);
						this.div = null;
					}

				}
			}
		},

		gallery: {
			feature: function(a) {
				Pictre.gallery.is.featuring = true;
				var self = Pictre;
				var pic = document.createElement("div");
				pic.className = "Pictre-overlay-pic";
				pic.data = a.data;
				pic.style.minWidth = Pictre._settings.picture.maxWidth + "px";
				pic.style.maxWidth = Pictre._settings.picture.maxWidth + "px";
				pic.style.width = Pictre._settings.picture.maxWidth + "px";
				pic.innerHTML = "<div class='Pictre-loader'><span class='fa fa-circle-o-notch fa-spin fa-3x'></span></div>";
				self._storage.overlay.image = pic;
				self._storage.overlay.iterator = a.data.id;
				document.body.style.height = $(window).height() + "px";
				document.body.style.overflow = "hidden";
				a.style.opacity = "0.1";
				Pictre.gallery.overlay.showImage(pic);
				Pictre.gallery.overlay.onclose = function() {
					if (a) a.style.opacity = Pictre._settings.data.visited;
				}
			},

			get: {
				all: function() {
					return this.images;
				},

				total: function() {
					return this.images.length;
				}
			},

			is: {
				featuring: false,
				warning: false
			},

			images: [],
			onready: function() {},

			overlay: {

				comments: null,
				div: null,

				exit: function() {

					if (!Pictre._storage.overlay.locked) {

						document.body.style.overflow = "auto";
						document.body.style.height = "auto";
						Pictre.gallery.is.featuring = false;

						this.remove();
						this.onclose();

						for (var i = 0; i < Pictre._storage.overlay.onexit.length; i++) {
							if (Pictre._storage.overlay.onexit[i]) Pictre._storage.overlay.onexit[i].call(this);
						}

					}

				},

				img: null,

				onclose: function() {},
				onexit: function(a) {
					Pictre._storage.overlay.onexit.push(a);
				},

				put: function() {

					if (!Pictre.gallery.overlay.div) {
						Pictre.gallery.overlay.div = document.createElement("div");
						Pictre.gallery.overlay.div.className = "Pictre-overlay";
						Pictre.gallery.overlay.div.style.display = "none";
						Pictre.gallery.overlay.div.tabIndex = "1";
					}

					Pictre.gallery.is.featuring = true;

					Pictre.extend(Pictre.gallery.overlay.div).on('click', function() {
						Pictre.gallery.overlay.exit();
					});

					Pictre.extend(Pictre.gallery.overlay.div).on('keydown', function(e) {
						// check for 'esc' key press
						if (e.keyCode == 27) {
							Pictre.gallery.overlay.exit();
						}

					});

					document.body.appendChild(Pictre.gallery.overlay.div);

					$(Pictre.gallery.overlay.div).fadeIn(Pictre._settings.speed);
					Pictre.gallery.overlay.div.focus();

					return Pictre.gallery.overlay.div;

				},

				showImage: function(b) {

					// cancel action if there is already an interface currently
					// using the gallery overlay
					if (Pictre.gallery.overlay.div) {
						return false;
					}

					if (b) {
						Pictre.gallery.overlay.wrapper = b;
					}

					Pictre.gallery.overlay.div = document.createElement("div");
					Pictre.gallery.overlay.div.className = "Pictre-overlay";
					Pictre.gallery.overlay.div.style.display = "none";
					Pictre.gallery.overlay.div.tabIndex = "1";

					var loader = document.createElement("div");
					loader.className = "Pictre-loader";
					loader.appended = false;

					Pictre.gallery.overlay.comments = document.createElement("div");
					Pictre.gallery.overlay.comments.appended = false;
					Pictre.gallery.overlay.comments.className = "Pictre-comments-wrapper";

					Pictre.gallery.overlay.img = new Image();
					Pictre.gallery.overlay.img.src = b.data.src;
					Pictre.gallery.overlay.img.data = b.data;
					Pictre.get.ui.imageOptions.is.disabled = Pictre.board.state > 1 ? false : true;

					Pictre.get.ui.imageOptions.put(b);

					Pictre.extend(Pictre.gallery.overlay.img).on('click', function(e) {

						e.stopPropagation();

						if (Pictre._storage.pictures[Pictre._storage.overlay.iterator + 1]) {
							Pictre.gallery.overlay.replaceImage();
						} else {
							Pictre.gallery.overlay.exit();
						}

					});

					Pictre.extend(Pictre.gallery.overlay.div).on('keydown', function(e) {

						if (e.keyCode == 39 || e.keyCode == 32 || e.keyCode == 38) {

							e.stopPropagation();
							e.preventDefault();

							if (Pictre._storage.pictures[Pictre._storage.overlay.iterator + 1]) {
								Pictre.gallery.overlay.replaceImage();
							}

						} else if (e.keyCode == 37 || e.keyCode == 40) {

							e.stopPropagation();
							e.preventDefault();

							if (Pictre._storage.pictures[Pictre._storage.overlay.iterator - 1]) {

								Pictre.gallery.overlay.replaceImage({
									previous: true
								});

							}

						}

					});

					Pictre.extend(Pictre.gallery.overlay.img).on('load', function() {

						var offset = Pictre.gallery.overlay.img.width > 350 ? ((Pictre._settings.picture.maxWidth - Pictre.gallery.overlay.img.width) / 2) : 200;

						// clear overlay image and comments area
						b.innerHTML = '';
						Pictre.gallery.overlay.comments.innerHTML = '';

						b.appendChild(Pictre.gallery.overlay.img);

						addComments(Pictre.gallery.overlay.img);

						b.appendChild(Pictre.gallery.overlay.comments);

						Pictre.gallery.overlay.comments.appended = true;

						Pictre.gallery.overlay.image.position(b);

						Pictre.gallery.overlay.comments.style.bottom = (-Pictre.gallery.overlay.comments.clientHeight) + "px";

						Pictre.extend(Pictre.gallery.overlay.comments).on('click', function(e) {
							e.stopPropagation();
						});

						Pictre.get.ui.imageOptions.div = null;
						Pictre.get.ui.imageOptions.put(this.parentNode);

						function addComments(scope) {

							if (scope.data.comments.length) {

								Pictre.gallery.overlay.comments.innerHTML = '';

								var e = 0;
								var comments = [];

								for (var i = scope.data.comments.length - 1; i >= 0; i--) {

									comments.push(document.createElement('div'));

									if (i == scope.data.comments.length - 1) {
										comments[e].style.borderTop = '0';
									}

									comments[e].className = "Pictre-comment";
									comments[e].innerHTML = "<span class='Pictre-comment-author'>" + scope.data.comments[i].author + "</span><p>" + scope.data.comments[i].body + "</p>";
									comments[e].children[0].style.right = offset + "px";

									Pictre.gallery.overlay.comments.appendChild(comments[e]);

									e++;

								}

							}

							var defaultPlaceholder = 'Enter your name...';
							var add = document.createElement("div");
							var author = Pictre._storage.comments.author || defaultPlaceholder;
							var ct = "Add a comment...";

							add.className = "Pictre-comment";
							add.disabled = false;

							var addCommentInputElement = document.createElement('input');
							addCommentInputElement.type = 'text';
							addCommentInputElement.className = 'Pictre-comment-input';
							addCommentInputElement.placeholder = ct;
							addCommentInputElement.maxLength = 200;

							var addAuthorInputElement = document.createElement('input');
							addAuthorInputElement.type = 'hidden';
							addAuthorInputElement.className = 'Pictre-comment-input Pictre-comment-input-name-overlay';
							addAuthorInputElement.placeholder = author;
							addAuthorInputElement.maxLength = 20;

							add.appendChild(addAuthorInputElement);
							add.appendChild(addCommentInputElement);

							// handle ui placement for IE
							if (Pictre.client.id >= 3 || (Pictre.client.id == 2 && Pictre.client.version.indexOf("5.1.") != -1)) {

								add.children[0].value = author;
								add.children[0].placeholder = '';

								Pictre.extend(add.children[0]).on('focus', function() {
									if (this.value == author) this.value = '';
								});

								Pictre.extend(add.children[0]).on('blur', function() {
									if (this.value == '') this.value = author;
								});

								add.children[1].value = ct;
								add.children[1].placeholder = '';

								Pictre.extend(add.children[1]).on('focus', function() {

									if (this.value == ct) {
										this.value = '';
									}

								});

								Pictre.extend(add.children[1]).on('blur', function() {

									if (this.value == '') {
										this.value = ct;
									}

								});

							}

							add.children[0].style.right = offset + "px";
							add.style.borderBottom = "0";

							Pictre.extend(addCommentInputElement).on('keydown', function(e) {

								e.stopPropagation();

								// check to see if 'enter' key was pressed
								if (e.keyCode != 13) {
									return false;
								}

								// check to see if a value was entered
								if (addCommentInputElement.value == '') {
									return false;
								}

								if (Pictre.terminal.isCommand(addCommentInputElement.value)) {

									var command = addCommentInputElement.value;

									add.disabled = true;
									addAuthorInputElement.disabled = true;
									addCommentInputElement.disabled = true;

									addCommentInputElement.value = 'loading, please wait...';

									Pictre.terminal.parse({

										id: Pictre.gallery.overlay.img.data.dbid,
										src: Pictre.gallery.overlay.img.data.src,
										thumb: Pictre.gallery.overlay.img.data.thumb,
										command: command

									}, function(data) {

										if (data.error) {

											add.disabled = false;
											addCommentInputElement.value = data.error;

											addCommentInputElement.removeAttribute('disabled');
											addAuthorInputElement.removeAttribute('disabled');

										}

									});

									return false;

								}

								// hide comment input
								addCommentInputElement.type = 'hidden';

								// display the author input field
								addAuthorInputElement.type = 'text';
								addAuthorInputElement.focus();

							});

							Pictre.extend(addAuthorInputElement).on('keydown', function(e) {

								e.stopPropagation();

								// check to see if 'enter' key was pressed
								if (e.keyCode != 13) {
									return false;
								}

								// check to see if an author's name was entered
								if (addAuthorInputElement.value == '' && addAuthorInputElement.placeholder == defaultPlaceholder) {
									return false;
								}

								if (addCommentInputElement.value != "" && addCommentInputElement.value != addCommentInputElement.placeholder && !add.disabled) {

									add.disabled = true;
									addAuthorInputElement.disabled = true;
									addCommentInputElement.disabled = true;

									var object = Pictre._storage.pictures[Pictre._storage.overlay.iterator];

									object.data.comments[object.data.comments.length] = {};
									object.data.comments[object.data.comments.length].author = addAuthorInputElement.value || addAuthorInputElement.placeholder;
									object.data.comments[object.data.comments.length].body = addCommentInputElement.value;

									object.data.comments.length++;

									Pictre.gallery.overlay.img.data = Pictre._storage.pictures[Pictre._storage.overlay.iterator].data;
									Pictre._storage.comments.author = object.data.comments[object.data.comments.length - 1].author;

									addAuthorInputElement.value = "loading, please wait...";

									var xhr = new XMLHttpRequest();
									xhr.open('POST', Pictre._settings.cloud.address + 'data.php', true);
									xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
									xhr.send("type=store_comment&id=" + object.data.dbid + "&author=" + object.data.comments[object.data.comments.length - 1].author + "&body=" + object.data.comments[object.data.comments.length - 1].body);

									Pictre.extend(xhr).on('readystatechange', function() {

										if (xhr.status == 200 && xhr.readyState == 4) {

											if (xhr.responseText == "success") {

												addComments(Pictre.gallery.overlay.img);
												Pictre.gallery.overlay.comments.style.bottom = (-Pictre.gallery.overlay.comments.clientHeight) + 'px';

											} else {
												addAuthorInputElement.value = "There was an error adding your comment, sorry about that!";
											}

										}

									});
								}
							});

							if (!scope.data.comments.length) {
								add.style.borderTop = '0';
							}

							Pictre.gallery.overlay.comments.appendChild(add);
						}

					});

					Pictre.gallery.overlay.div.appendChild(b);
					Pictre.gallery.overlay.put();
				},
				image: {
					get: function() {
						return Pictre._storage;
					},
					position: function(a) {
						if (Pictre.gallery.is.featuring) {
							if (Pictre.gallery.overlay.div) Pictre.gallery.overlay.div.style.height = $(window).height() + "px";
							var img = a.childNodes[0];
							var width = img.width;
							var height = img.height;
							if (img.width > Pictre._settings.picture.maxWidth) {
								var w = img.width;
								var h = img.height;
								width = Pictre._settings.picture.maxWidth;
								height = Pictre._settings.picture.maxWidth * h / w;
							}
							a.style.width = width + "px";
							if (img.height <= Pictre.gallery.overlay.div.clientHeight) {
								var offset = $(window).height() - height;
								a.style.marginTop = (offset / 2) + "px";
							} else {
								a.style.marginTop = "5px";
							}
						}
					}
				},
				remove: function() {
					if (this.div) document.body.removeChild(this.div), this.div = null;
				},
				replaceImage: function(a) {

					var settings = {

						previous: false,
						id: null,
						object: null

					};

					if (typeof a == 'object') {

						for (var i in a) {
							settings[i] = a[i];
						}

					}

					if (settings.id || settings.object) {
						var object = document.getElementById("pic" + settings.id) || settings.object;
						Pictre._storage.overlay.iterator = Pictre._storage.pictures.indexOf(object);
					} else {
						if (settings.previous) Pictre._storage.overlay.iterator--;
						else Pictre._storage.overlay.iterator++;
					}

					if (Pictre.gallery.overlay.img) {

						var src = Pictre.gallery.overlay.img ? Pictre.gallery.overlay.img.src.split('/') : null;
						src = src[src.length - 1];

						var newSrc = Pictre._storage.pictures[Pictre._storage.overlay.iterator].data.src.split('/');
						newSrc = newSrc[newSrc.length - 1];

						// if new image does not have the same source as the one being replaced,
						// show the loader and fetch the new image
						if (src != newSrc) {
							Pictre.gallery.overlay.wrapper.innerHTML = "<div class='Pictre-loader'><span class='fa fa-circle-o-notch fa-spin fa-3x'></span></div>";
						}

						Pictre.gallery.overlay.img.src = Pictre._storage.pictures[Pictre._storage.overlay.iterator].data.src;
						Pictre.gallery.overlay.img.data = Pictre._storage.pictures[Pictre._storage.overlay.iterator].data;

						if (Pictre.gallery.overlay.img.data.comments.length) {
							Pictre.gallery.overlay.comments.appended = true;
						} else {
							Pictre.gallery.overlay.comments.appended = false;
						}

						Pictre._storage.pictures[Pictre._storage.overlay.iterator].style.opacity = Pictre._settings.data.visited;

					}

				},

				wrapper: null
			}
		},
		init: function(a, b, c, developerMode) {

			var spacer = document.createElement("div");
			spacer.className = "Pictre-spacer";

			if (b) {
				Pictre._settings.cloud.datadir = b;
			}

			if (c) {
				Pictre._settings.cloud.address = c;
			}

			if (developerMode) {
				Pictre.is.production = false;
			}

			Pictre.get.ui.menu.put(document.body, a);
			Pictre.client.detect();
			Pictre.board.detect();
			if (Pictre.board.is.set) {
				if (Pictre.board.get().toLowerCase().match(/[^a-z0-9\-\.\+\_]/gi)) {
					var err = document.createElement("p");
					err.innerHTML = "404. The album you are looking for cannot be found.";
					err.className = "Pictre-home-wrapper-about";
					Pictre.get.ui.notice("This album does not exist as it contains invalid characters in its name.");
					err.appendChild(spacer);
					// Pictre.get.ui.home.put().appendTo(a).appendChild(err);
					Pictre.get.ui.splash.put("This album does not exist as it contains invalid characters in its name.");
				} else if (Pictre._settings.pages.restricted.indexOf(Pictre.board.get().toLowerCase()) != -1) {
					var err = document.createElement("p");
					err.innerHTML = "403. The album you are looking for is restricted. Try another one by typing it above or type another album address.";
					err.className = "Pictre-home-wrapper-about";
					Pictre.get.ui.notice("This album is private or restricted. Please try another one.");
					err.appendChild(spacer);
					// Pictre.get.ui.home.put().appendTo(a).appendChild(err);
					Pictre.get.ui.splash.put("This album is private or restricted.");
				} else {
					Pictre.board.exists = true;
					var wrapper = document.createElement("div");
					wrapper.id = "Pictre-wrapper";
					a.appendChild(wrapper);
					this.set.wrapper(wrapper);
					Pictre.get.ui.notice("Loading, please wait...");
					Pictre.get.db({
						album: true,
						resource: 'album',
						limit: Pictre._settings.data.limit.pageload
					}, function(data) {

						// detect 'loading bar' demo
						if (Pictre._settings.demo.loader) {

							console.log("Warning: loader demo active.");

							(function demo(n, t) {
								if (t) clearTimeout(t);
								t = setTimeout(function() {
									Pictre.get.ui.loader.put(n);
									n += 0.002;
									if (n >= 0.995) n = 0;
									demo(n, t);
								}, 1000 / 60);
							})(0);

						} else {
							Pictre.load(data);
						}

					});

					Pictre.events.on('dragover', function() {
						if (!Pictre.gallery.is.featuring && !Pictre.is.spotlight && Pictre._settings.allowUploads) Pictre.get.ui.upload.put();
					});

					Pictre.events.on('hashchange', function() {
						Pictre.get.hash();
					});
				}
			} else {

				if (Pictre.is.updating) {
					Pictre.get.ui.notice("Updates are currently in progress...");
				}

				Pictre.get.ui.splash.put();
			}
		},

		is: {

			busy: false,
			done: false,
			loading: false,
			loaded: false,
			production: true,
			scrollingDown: false,
			spotlight: false,
			updating: false

		},

		load: function(a, b, c) {

			var self = this;
			var settings = {
				method: 'replace'
			};

			if (typeof b == 'object') {

				for (var i in b) {
					settings[i] = b[i];
				}

			}

			if (a) {

				if (settings.method == "append") {

					for (var i = 0; i < a.length; i++) {
						Pictre.create.picture(a[i], settings.method);
					}

					if (typeof c == 'function') {
						c.call(Pictre);
					}

				} else if (settings.method == 'prepend') {

					if (!Pictre._storage.pictures.length) {
						Pictre._404.remove();
					}

					for (var i = a.length - 1; i >= 0; i--) {
						Pictre.create.picture(a[i], settings.method);
					}

					for (var i = 0; i < Pictre._storage.pictures.length; i++) {
						Pictre._storage.pictures[i].data.id = i;
					}

					var n = parseInt(Pictre._storage.data.totalDiv.innerHTML);
					Pictre._storage.data.totalDiv.innerHTML = n + a.length;

				} else if (settings.method == 'replace') {

					this._storage.iterator = 0;
					this._storage.pictures = [];

					while (Pictre._settings.wrapper.hasChildNodes()) {
						Pictre._settings.wrapper.removeChild(Pictre._settings.wrapper.lastChild);
					}

					for (var i = 0; i < a.length; i++) {
						Pictre.create.picture(a[i]);
					}

					if (Pictre.is.updating) {
						Pictre.get.ui.notice("Updates are currently in progress... Some features may not work.");
					} else {
						Pictre.get.ui.notice(Pictre.board.get() + ' Picture Board', a.total);
					}

					Pictre._storage.data.total = a.total;
					Pictre._settings.data.album = Pictre.board.get().toLowerCase();

					Pictre.get.ui.menu.addButton({

						id: 'upload',
						name: 'upload',
						title: 'Upload pictures to this board'

					}).on('click', function() {

						if (Pictre.is.spotlight) {
							// remove existing spotlight overlay
							Pictre.spotlight.remove();

							if (Pictre.get.ui.menu.hasButton('back')) {
								// remove 'back' button if on mobile
								Pictre.get.ui.menu.removeButton('back');

								if (Pictre.board.state > 0) {

									if (Pictre.board.state == 1) {
										Pictre.get.ui.menu.showButton('lock');
									} else {
										Pictre.get.ui.menu.showButton('unlock');
									}

								}
							}
						}

						if (Pictre._settings.allowUploads) {
							Pictre.get.ui.upload.put();
						} else {
							Pictre.get.ui.notice("Uploads have been disabled for this album.");
						}

					});

					if (a.hasOwnProperty('kind')) {
						Pictre.board.set.state(a.kind);
					}

					if (!Pictre._storage.pictures.length) {

						Pictre._404.put("There doesn't seem to be anything here. Be the first to add pictures to this album!");

						if (Pictre._settings.allowUploads) {
							Pictre.get.ui.upload.put();
						}

					} else {
						Pictre.get.hash();
					}
				}

				Pictre._settings.data.anchor += a.length;
			}

			return Pictre;
		},

		properties: {
			className: "Pictre-pic"
		},

		set: {

			wrapper: function(a, b) {

				Pictre._settings.wrapper = a;

				if (typeof b == "function") {
					b.call(Pictre);
				}
			}

		},

		/**
		 * 'spotlight' is the mobile implementation of the pictre
		 * user-interface wrapper for comments, image slideshow, and
		 * app behavior. It is invoked whenever the screen size falls
		 * below an acceptable viewing width for a desktop experience.
		 */
		spotlight: {

			_wrapper: null,

			feature: function(a) {

				if (this._wrapper) {
					document.body.removeChild(this._wrapper);
				}

				var self = this;
				var width;
				var clientWidth;

				Pictre._storage.overlay.iterator = a.data.id;

				if (!Pictre.is.spotlight) {

					if (document.body.scrollTop) {
						Pictre._storage.scrollTop = document.body.scrollTop;
					} else {

						Pictre._settings.spotlight.useDocumentElement = true;
						Pictre._storage.scrollTop = document.documentElement.scrollTop;

					}

				}

				slideWrapper();

				Pictre.is.spotlight = true;

				if (!Pictre.get.ui.menu.hasButton('back')) {

					if (Pictre.get.ui.menu.hasButton('lock')) {
						Pictre.get.ui.menu.hideButton('lock');
					}

					if (Pictre.get.ui.menu.hasButton('unlock')) {
						Pictre.get.ui.menu.hideButton('unlock');
					}

					Pictre.get.ui.menu.addButton({

						id: 'back',
						name: 'back',
						title: 'Go back to the album'

					}).on('click', function() {

						self.remove();

						Pictre.get.ui.menu.removeButton('back');

						if (Pictre.board.state > 0) {

							if (Pictre.board.state == 1) {
								Pictre.get.ui.menu.showButton('lock');
							} else {
								Pictre.get.ui.menu.showButton('unlock');
							}

						}

					});
				}

				this._wrapper = document.createElement("div");
				this._wrapper.id = "Pictre-spotlight-wrapper";

				var comments = document.createElement("div");
				comments.id = "Pictre-spotlight-wrapper-comments";
				comments.style.width = "500px";
				comments.width = parseInt(comments.style.width.split("px")[0]);

				var pic = document.createElement("div");
				pic.id = 'Pictre-spotlight-wrapper-pic';
				pic.innerHTML = '<p>Loading, please wait...</p>';

				var img = new Image();
				img.src = a.data.src;

				Pictre.extend(img).on('load', function() {

					var b = img.data ? img : a;

					pic.innerHTML = '';
					pic.style.width = img.width + 'px';
					comments.innerHTML = '';

					pic.appendChild(img);

					width = img.width;
					clientWidth = pic.clientWidth;
					pic.padding = parseInt(window.getComputedStyle(pic).getPropertyValue('padding-left').split("px")[0]) * 2 + 4;

					position();

					comments.style.display = 'block';
					comments.style.top = (pic.clientHeight + 50) + 'px';

					loadComments();

					/**
					 * prepares the comments container by clearing it of text, adding event listeners 
					 * to it, and creating and appending its children (to hold comment data).
					 *
					 * creates comment wrapper that holds comment-creation input and divs for existing comments
					 */
					function loadComments() {

						comments.innerHTML = '';

						var placeholder = Pictre._storage.comments.author || 'Enter your name...';

						var addComment = document.createElement('div');
						addComment.className = 'comment';
						addComment.style.marginBottom = "20px";

						var addCommentInputWrapper = document.createElement('p');

						var addBodyToComment = document.createElement('input');
						addBodyToComment.type = 'text';
						addBodyToComment.placeholder = 'Add a comment...';

						var addAuthorToComment = document.createElement('input');
						addAuthorToComment.type = 'hidden';
						addAuthorToComment.placeholder = placeholder;

						addComment.appendChild(addCommentInputWrapper);
						addCommentInputWrapper.appendChild(addBodyToComment);
						addCommentInputWrapper.appendChild(addAuthorToComment);

						Pictre.extend(addBodyToComment).on('keydown', function(e) {

							// check to see that key pressed was 'enter' and that 
							// there is text in the comment input
							if (e.keyCode != 13 || addBodyToComment.value == '') {
								return false;
							}

							if (Pictre.terminal.isCommand(addBodyToComment.value)) {

								var command = addBodyToComment.value;

								addBodyToComment.disabled = true;
								addBodyToComment.value = 'loading, please wait...';

								Pictre.terminal.parse({

									id: a.data.dbid,
									src: a.data.src,
									thumb: a.data.thumb,
									command: command

								}, function(data) {

									if (data.error) {
										addBodyToComment.value = data.error;
										addBodyToComment.removeAttribute('disabled');
									}

								});

								return false;

							}

							addBodyToComment.type = 'hidden';
							addAuthorToComment.type = 'text';

							addAuthorToComment.focus();

						});

						Pictre.extend(addAuthorToComment).on('keydown', function(e) {

							// check to see that key pressed was 'enter' and that 
							// there is text in the comment input
							if (e.keyCode != 13 || addAuthorToComment.value == '') {
								return false;
							}

							Pictre._storage.comments.author = addAuthorToComment.value;

							b.data.comments[b.data.comments.length] = {};
							b.data.comments[b.data.comments.length].author = addAuthorToComment.value || 'Anonymous';
							b.data.comments[b.data.comments.length].body = addBodyToComment.value;

							b.data.comments.length++;

							addAuthorToComment.disabled = true;
							addAuthorToComment.value = 'loading, please wait...';

							var xhr = new XMLHttpRequest();

							xhr.open('POST', Pictre._settings.cloud.address + 'data.php', true);
							xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
							xhr.send("type=store_comment&id=" + b.data.dbid + "&author=" + b.data.comments[b.data.comments.length - 1].author + "&body=" + b.data.comments[b.data.comments.length - 1].body);

							Pictre.extend(xhr).on('readystatechange', function() {

								if (xhr.readyState == 4 && xhr.status == 200) {
									if (xhr.responseText == "success") {
										addAuthorToComment.value = '';
										loadComments();
									} else {
										addAuthorToComment.value = xhr.responseText;
									}

									addAuthorToComment.removeAttribute('disabled');
								}

							});


						});

						comments.appendChild(addComment);

						if (b.data.comments.length) {

							comments.style.borderBottomColor = "rgba(61,65,65,0.75)";

							for (var i = b.data.comments.length - 1; i >= 0; i--) {

								var comment = document.createElement("div");
								comment.className = "comment";
								comment.innerHTML = "<div class='author'>" + b.data.comments[i].author + "</div>";
								comment.innerHTML += "<p>" + b.data.comments[i].body + "</p>";

								comments.appendChild(comment);

								if (self._wrapper) {
									self._wrapper.style.height = $(window).height() + 'px';
								}

							}

						} else {
							comments.style.borderBottomColor = "transparent";
						}

					}
				});

				Pictre.extend(img).on('click', function(e) {

					if (Pictre._storage.pictures[Pictre._storage.overlay.iterator + 1]) {

						Pictre._storage.overlay.iterator++;

						this.data = Pictre._storage.pictures[Pictre._storage.overlay.iterator].data;
						Pictre._storage.pictures[Pictre._storage.overlay.iterator].style.opacity = Pictre._settings.data.visited;

						window.location.assign('#' + this.data.dbid);

					} else {
						self.remove();
					}

				});

				this._wrapper.appendChild(pic);
				this._wrapper.appendChild(comments);

				document.body.appendChild(this._wrapper);

				this._wrapper.style.left = this._wrapper.clientWidth + 'px';

				slideWrapper();

				clientWidth = pic.clientWidth;
				pic.padding = parseInt(window.getComputedStyle(pic).getPropertyValue('padding-left').split("px")[0]) * 2 + 4;

				Pictre.events.on('resize', function() {
					position();
				});

				function slideWrapper() {

					if (Pictre._settings.spotlight.useDocumentElement) {

						$(document.body).animate({
							scrollTop: 0
						}, Pictre._settings.spotlight.transitionSpeed);

						$(document.documentElement).animate({
							scrollTop: 0
						}, Pictre._settings.spotlight.transitionSpeed, function() {
							slide();
						});

					} else {

						$(document.body).animate({
							scrollTop: 0
						}, Pictre._settings.spotlight.transitionSpeed, function() {
							slide();
						});

					}

					function slide() {
						$(Pictre._settings.wrapper.parentNode).animate({
							left: (-Pictre._settings.wrapper.parentNode.clientWidth) + "px"
						}, Pictre._settings.spotlight.transitionSpeed);
						$(self._wrapper).animate({
							left: 0
						}, Pictre._settings.spotlight.transitionSpeed, function() {
							position();
						});
					}
				}

				function position() {
					if (Pictre.is.spotlight) {
						document.body.scrollLeft = 0;
						Pictre._settings.wrapper.parentNode.style.left = (-Pictre._settings.wrapper.parentNode.clientWidth) + "px"
						comments.style.left = (window.innerWidth / 2 - comments.width / 2) + "px";
						if (window.innerWidth < comments.width) {
							comments.style.left = "0";
							comments.style.width = (window.innerWidth - 4) + "px";
						}
						if (window.innerWidth < clientWidth) {
							pic.style.left = "0";
							pic.style.width = (window.innerWidth - pic.padding) + "px";
							img.style.width = (window.innerWidth - pic.padding) + "px";
						} else {
							pic.style.width = width + "px";
							img.style.width = width + "px";
							pic.style.left = (window.innerWidth / 2 - pic.offsetWidth / 2) + "px";
							comments.style.left = (window.innerWidth / 2 - comments.width / 2) + "px";
						}
						comments.style.top = (pic.clientHeight + 50) + "px";
					}
				}
			},
			remove: function() {
				var self = this;
				if (this._wrapper) {
					document.body.style.overflowY = "auto";
					$(this._wrapper).animate({
						left: Pictre.spotlight._wrapper.clientWidth + "px"
					}, Pictre._settings.spotlight.transitionSpeed, function() {
						document.body.removeChild(self._wrapper);
						self._wrapper = null;
					});
					$(Pictre._settings.wrapper.parentNode).animate({
						left: 0
					}, Pictre._settings.spotlight.transitionSpeed);
					if (Pictre._storage.chisel.queued) {
						Pictre.chisel();
						Pictre._storage.chisel.queued = false;
					}
					if (Pictre._storage.scrollTop !== null) {
						if (Pictre._settings.spotlight.useDocumentElement) document.documentElement.scrollTop = Pictre._storage.scrollTop;
						else document.body.scrollTop = Pictre._storage.scrollTop;
					}
					Pictre.is.spotlight = false;
				} else {
					if (Pictre._storage.scrollTop === null) Pictre._storage.chisel.queued = false;
				}
			}
		},
		terminal: {
			log: {
				error: false,
				success: false
			},
			isCommand: function(a) {
				if (a.match(/^(\/pictre\ )/gi)) return true;
				else return false;
			},
			parse: function(a, b) {
				this.log.error = "";
				var self = this;
				var settings = {
					command: null,
					id: null,
					src: null,
					thumb: null
				};
				if (typeof a == "object") {
					for (var i in a) {
						settings[i] = a[i];
					}
				} else settings.command = a;
				if (settings.command.match(/^(\/pictre\ )(delete|borrar|radera)/gi)) {
					if (Pictre.board.state < 2) {
						self.log.error = "You are not authorized to use that command.";
						if (typeof b == "function") b.call(Pictre.terminal, Pictre.terminal.log);
					} else if (settings.id && settings.src && settings.thumb) {
						var xhr = new XMLHttpRequest();
						xhr.open('POST', Pictre._settings.cloud.address + 'data.php', true);
						xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
						xhr.send("type=command&command=delete&id=" + settings.id + "&source=" + encodeURIComponent(settings.src) + "&thumb=" + encodeURIComponent(settings.thumb));
						Pictre.extend(xhr).on('readystatechange', function() {
							if (xhr.readyState == 4 && xhr.status == 200) {
								if (xhr.responseText == "success") {
									self.log.success = true;
									if (Pictre.is.spotlight) Pictre.spotlight.remove();
									else if (Pictre.gallery.is.featuring) Pictre.gallery.overlay.div.click();
									var p = Pictre._storage.pictures[Pictre._storage.overlay.iterator];
									var margin = window.getComputedStyle(p).getPropertyValue('margin-top').split("px")[0];
									var height = p.offsetHeight - parseInt(margin * 2);
									p.innerHTML = "<p style='display:table;height:100%;width:100%;'><span style='display:table-cell;width:100%;text-align:center;vertical-align:middle;'>Picture deleted</span></p>";
									p.style.height = height + "px";
									p.style.opacity = "0.6";
									Pictre._storage.pictures.splice(Pictre._storage.overlay.iterator, 1);
									Pictre._storage.data.deleted++;
									for (var i = 0; i < Pictre._storage.pictures.length; i++) {
										Pictre._storage.pictures[i].data.id = i;
									}
									$(p).fadeOut('slow', function() {
										Pictre.chisel();
										var count = parseInt(Pictre._storage.data.totalDiv.innerHTML);
										Pictre._storage.data.totalDiv.innerHTML = count - 1;
									});
								} else self.log.error = "Pictre encountered an error and could not process your command, sorry about that! (" + xhr.responseText + ")";
								if (typeof b == "function") b.call(Pictre.terminal, Pictre.terminal.log);
							}
						});
					} else {
						self.log.error = "You have missing parameters for that command.";
						if (typeof b == "function") b.call(Pictre.terminal, Pictre.terminal.log);
					}
				} else if (settings.command.match(/^(\/pictre\ )(filecheck)/gi)) {
					console.log("Preloading " + Pictre._storage.data.total + " images, please wait...");
					Pictre.is.busy = true;
					if (Pictre.gallery.is.featuring) Pictre.gallery.overlay.exit();
					var oldRequest = Pictre._settings.data.limit.request;
					Pictre._settings.data.limit.request = Pictre._storage.data.total;
					Pictre.get.db({
						from: 'all'
					}, function(data) {
						console.log("Appending images to document...");
						Pictre.load(data, {
							method: 'append'
						}, function() {
							console.log("Checking for file consistency...");
							var img = [];
							var loaded = 0;
							var errors = [];
							for (var i = 0; i < Pictre._storage.pictures.length; i++) {
								img.push(new Image());
								img[i].src = Pictre._storage.pictures[i].data.src;
								img[i].data = Pictre._storage.pictures[i].data;
								img[i].style.display = "none";
								Pictre.extend(img[i]).on('load', function() {
									loaded++;
									console.log("image " + loaded + " loaded");
									if (loaded == Pictre._storage.data.total) _runonload();
								});
								Pictre.extend(img[i]).on('error', function() {
									loaded++;
									errors.push(this);
									if (loaded == Pictre._storage.data.total) _runonload();
								});
								document.body.appendChild(img[i]);
								Pictre._settings.data.limit.request = oldRequest;
								Pictre.is.busy = false;
							}

							function _runonload() {
								if (errors.length) {
									console.log(errors.length + " errors detected, listing corrupted files below...");
									for (var i = 0; i < errors.length; i++) {
										console.log("Image " + i + " error: ");
										console.log(errors[i].data);
									}
								} else console.log("All files exist. No errors detected... Restructuring Pictre, please wait..."), Pictre.chisel();
							}
						});
					});
				} else {
					self.log.error = "Command not found: " + settings.command;
					if (typeof b == "function") b.call(self, self.log)
				}
			}
		}
	};
	window.Pictre = Pictre;
})(window, document);