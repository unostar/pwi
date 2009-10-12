/**
 * Picasa Webalbum Integration jQuery plugin
 * This library was inspired aon pwa by Dieter Raber
 * @name jquery.pwi.js
 * @author Jeroen Diderik - http://www.multiprof.nl/
 * @revision 1.1.00
 * @date September 12, 2009
 * @copyright (c) 2009 Jeroen Diderik(www.multiprof.nl)
 * @license Creative Commons Attribution-Share Alike 3.0 Netherlands License - http://creativecommons.org/licenses/by-sa/3.0/nl/
 * @Visit http://pwi.googlecode.com/ for more informations, duscussions etc about this library
 */
(function ($) {
	var elem, opts = {};
	$.fn.pwi = function (opts) {
		var $self, settings = {};
		opts = $.extend({},
		$.fn.pwi.defaults, opts);
		elem = this;
		function _initialize() {
			settings = opts;
			ts = new Date().getTime();
			settings.id = ts;
			$self = $("<div id='pwi_" + ts + "'/>").appendTo(elem);
			$self.addClass('pwi_container');
			_start();
			return false;
		};
		function _start() {
			if (settings.username == '') {
				alert('Обязательно укажите хотя бы имя пользователя.' + '\n' + 'См. доп. инфо http://pwi.googlecode.com');
				return;
			}
			switch (settings.mode) {
			case 'latest':
				getLatest();
				break;
			case 'album':
				getAlbum();
				break;
			default:
				getAlbums();
				break;
			};
		}
		function formatDate($dt) {
			var $today = new Date(Number($dt)),
			$year = $today.getYear();
			if ($year < 1000) {
				$year += 1900;
			};
			return ($today.getDate() + " " + settings.months[($today.getMonth())] + " " + $year);
		};
		function formatDateTime($dt) {
			var $today = new Date(Number($dt)),
			$year = $today.getYear();
			if ($year < 1000) {
				$year += 1900
			};
			return ($today.getDate()+" "+settings.months[($today.getMonth())]+" "+$year+", "+$today.getHours()+":"+($today.getMinutes()<10?"0"+$today.getMinutes():$today.getMinutes()));
		};
		function albums(j) {
			var $scAlbums = $("<div/>");
			for (var i = 0; i < j.feed.entry.length; i++) {
				var $id_base = j.feed.entry[i].gphoto$name.$t,
				$album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t),
				$thumb = j.feed.entry[i].media$group.media$thumbnail[0].url.replace(new RegExp("/s160-c/", "g"), "/"),
				$scAlbum;
				if ($.inArray($id_base, settings.albums) > -1 || settings.albums.length == 0) {
					$scAlbum = $("<div class='pwi_album'/>").bind('click.pwi', $id_base, function (e) {
						e.stopPropagation();
						settings.page = 1;
						settings.album = e.data;
						getAlbum();
						return false;
					});
					$scAlbum.append("<img src='" + $thumb + "?imgmax=" + settings.albumThumbSize + "&crop=" + settings.albumCrop + "'/>");
					settings.showAlbumTitles ? $scAlbum.append("<br/>" + j.feed.entry[i].title.$t + "<br/>" + (settings.showAlbumdate ? $album_date : "") + (settings.showAlbumPhotoCount ? "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " " + settings.labels.photos : "")) : false;
					$scAlbums.append($scAlbum);
				}
			};
			$scAlbums.append("<div style='clear: both;height:0px;'/>");
			show(false, $scAlbums);
		}
		function album(j) {
			var $scPhotos, $scPhotosDesc, $np = j.feed.openSearch$totalResults.$t,
			$loc = j.feed.gphoto$location.$t == "undefined" ? "" : j.feed.gphoto$location.$t,
			$ad = j.feed.subtitle.$t == "undefined" ? "" : j.feed.subtitle.$t,
			$album_date = formatDate(j.feed.gphoto$timestamp.$t),
			$item_plural = ($np == "1") ? false : true,
			$len = j.feed.entry.length;
			settings.albumTitle = j.feed.title.$t == "undefined" ? settings.albumTitle : j.feed.title.$t;
			$scPhotos = $("<div/>");
			$scPhotosDesc = $("<div class='pwi_album_description'/>");
			if (settings.mode != 'album') {
				var tmp = $("<div class='pwi_album_backlink'>" + settings.labels.albums + "</div>").bind('click.pwi', function (e) {
					e.stopPropagation();
					getAlbums();
					return false;
				});
				$scPhotosDesc.append(tmp);
			}
			if (settings.showAlbumDescription) {
				$scPhotosDesc.append("<div class='title'>" + settings.albumTitle + "</div>");
				$scPhotosDesc.append("<div class='details'>" + $np + " " + ($item_plural ? settings.labels.photos : settings.labels.photo) + (settings.showAlbumdate ? ", " + $album_date : "") + (settings.showAlbumLocation && $loc ? ", " + $loc : "") + "</div>");
				$scPhotosDesc.append("<div class='description'>" + $ad + "</div>");
				if (settings.showSlideshowLink) {
					$scPhotosDesc.append("<div><a href='http://picasaweb.google.com/" + settings.username + "/" + j.feed.gphoto$name.$t + "" + ((settings.authKey != "") ? "?authkey=" + settings.authKey : "") + "#slideshow/" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new' class='sslink'>" + settings.labels.slideshow + "</a></div>");
				}
			};
			$scPhotos.append($scPhotosDesc);
			if ($np > settings.maxResults) {
				$pageCount = ($np / settings.maxResults);
				var $ppage = $("<div class='pwi_prevpage'/>").text(settings.labels.prev),
				$npage = $("<div class='pwi_nextpage'/>").text(settings.labels.next),
				$navRow = $("<div class='pwi_pager'/>");
				if (settings.page > 1) {
					$ppage.addClass('link').bind('click.pwi', function (e) {
						e.stopPropagation();
						settings.page = (parseInt(settings.page) - 1);
						getAlbum();
						return false;
					});
				};
				$navRow.append($ppage);
				for (var i = 1; i < $pageCount + 1; i++) {
					if (i == settings.page) {
						tmp = "<div class='pwi_pager_current'>" + i + "</div> ";
					} else {
						tmp = $("<div class='pwi_pager_page'>" + i + "</div>").bind('click.pwi', i, function (e) {
							e.stopPropagation();
							settings.page = e.data;
							getAlbum();
							return false
						});
					};
					$navRow.append(tmp);
				};
				if (settings.page < $pageCount) {
					$npage.addClass('link').bind('click.pwi', function (e) {
						e.stopPropagation();
						settings.page = (parseInt(settings.page) + 1);
						getAlbum();
						return false
					});
				};
				$navRow.append($npage);
				$scPhotos.append($navRow);
			};
			for (var i = 0; i < $len; i++) {
				var $img_base = j.feed.entry[i].content.src,
				$id_base = j.feed.entry[i].gphoto$id.$t,
				$c = (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t : ""),
					$dt = settings.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : formatDateTime(j.feed.entry[i].gphoto$timestamp.$t) ) : "",
					$d = $c.replace(new RegExp("'", "g"), "&#39;") + " " + $dt;
				$scPhoto = $("<div class='pwi_photo' style='height:" + (settings.thumbSize + 1) + "px;cursor: pointer;'/>");
				$scPhoto.append("<a href='" + $img_base + "?imgmax=" + settings.photoSize + "' rel='lb-" + settings.username + "' title='" + $d + "'><img src='" + $img_base + "?imgmax=" + settings.thumbSize + "&crop=" + settings.thumbCrop + "'/></a>");
				if (settings.showPhotoCaption) $scPhoto.append("<br/>" + $c);
				$scPhotos.append($scPhoto);
			}
			$scPhotos.append($navRow);
			$scPhotos.append("<div style='clear: both;height:0px;'/>");
			settings.photostore = $scPhotos;
			var $s = $(".pwi_photo", $scPhotos).css(settings.thumbCss);
			if (typeof(settings.popupExt) === "function") {
				settings.popupExt($s.find("a[rel='lb-" + settings.username + "']"));
			} else if (typeof(settings.onclickThumb) === "function") {
				$s.find("a[rel='lb-" + settings.username + "']").bind('click.pwi', clickThumb);
			} else if (typeof(settings.onclickThumb) != "function" && $.slimbox) {
				$s.find("a[rel='lb-" + settings.username + "']").slimbox(settings.slimbox_config);
			}
			show(false, settings.photostore);
		};
		function latest(j) {
			var $scPhotos = $("<div/>"),
			$len = j.feed.entry.length ? j.feed.entry.length : 0;
			for (var i = 0; i < $len; i++) {
				var $img_base = j.feed.entry[i].content.src,
				$id_base = j.feed.entry[i].gphoto$id.$t,
				$c = settings.showPhotoCaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t : "") : "",
					$dt = settings.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : formatDateTime(j.feed.entry[i].gphoto$timestamp.$t) ) : "",
					$d = $c.replace(new RegExp("'", "g"), "&#39;") + " " + $dt;
				$scPhoto = $("<div class='pwi_photo' >");
				$scPhoto.append("<a href='" + $img_base + "?imgmax=" + settings.photoSize + "' rel='lb-" + settings.username + "' title='" + $d + "'><img src='" + $img_base + "?imgmax=" + settings.thumbSize + "&crop=" + settings.thumbCrop + "'/></a>");
				$scPhoto.append("<br/>" + $c);
				$scPhotos.append($scPhoto);
			}
			$scPhotos.append("<div style='clear: both;height:0px;'> </div>");
			var $s = $("div.pwi_photo", $scPhotos).css(settings.thumbCss);
			if (typeof(settings.popupExt) === "function") {
				settings.popupExt($s.find("a[rel='lb-" + settings.username + "']"));
			} else if (typeof(settings.onclickThumb) === "function") {
				$s.find("a[rel='lb-" + settings.username + "']").bind('click', clickThumb);
			} else if (typeof(settings.onclickThumb) != "function" && $.slimbox) {
				$s.find("a[rel='lb-" + settings.username + "']").slimbox(settings.slimbox_config);
			}
			show(false, $scPhotos);
		};
		function clickThumb() {
			settings.onclickThumb.call(this);
			return false;
		};
		function getAlbums() {
			if (settings.albumstore != "") {
				show(false, settings.albumstore);
			} else {
				show(true, '');
				var $url = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username + '?kind=album&max-results=' + settings.albumMaxResults + '&access=' + settings.albumTypes + '&alt=json';
				$.getJSON($url, 'callback=?', albums);
			};
			return $self;
		};
		function getAlbum() {
			var $si = ((settings.page - 1) * settings.maxResults) + 1,
			$url = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username + '/album/' + settings.album + '?kind=photo&max-results=' + settings.maxResults + '&start-index=' + $si + '&alt=json' + ((settings.authKey != "") ? "&authkey=" + settings.authKey : "");
			show(true, '');
			$.getJSON($url, 'callback=?', album);
			return $self;
		};
		function getLatest() {
			show(true, '');
			var $url = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username + (settings.album != "" ? '/album/' + settings.album : '') + '?kind=photo&max-results=' + settings.maxResults + '&alt=json&q=' + ((settings.authKey != "") ? "&authkey=" + settings.authKey : "");
			$.getJSON($url, 'callback=?', latest);
			return $self;
		};
		function show(loading, data) {
			if (loading) {
				if ($.blockUI) $self.block(settings.blockUIConfig);
			} else { if ($.blockUI) $self.unblock();
				$self.html(data);
			};
		};
		_initialize();
	};
	$.fn.pwi.defaults = {
		mode: 'albums',
		username: '',
		album: "",
		authKey: "",
		albums: [],
		albumCrop: 1,
		albumTitle: "",
		albumThumbSize: 160,
		albumMaxResults: 999,
		albumStartIndex: 1,
		albumTypes: "public",
		page: 1,
		photoSize: 800,
		maxResults: 20,
		thumbSize: 160,
		thumbCrop: 1,
		thumbCss: {
			'margin': '5px'
		},
		onclickThumb: "",
		popupExt: "",
		showAlbumTitles: true,
		showAlbumdate: true,
		showAlbumPhotoCount: true,
		showAlbumDescription: true,
		showAlbumLocation: true,
		showSlideshowLink: true,
		showPhotoCaption: false,
		showPhotoDate: true,
		labels: {
			photo:"фото",
			photos: "фото",
			albums: "Вернуться к альбомам",
			slideshow: "Показать слайдшоу",
			loading: "Загружаю...",
			page: "Страница",
			prev: "Предыдущая",
			next: "Следующая",
			devider: "|"
		},
		months: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
		slimbox_config: {
			loop: false,
			overlayOpacity: 0.6,
			overlayFadeDuration: 400,
			resizeDuration: 400,
			resizeEasing: "swing",
			initialWidth: 250,
			initlaHeight: 250,
			imageFadeDuration: 400,
			captionAnimationDuration: 400,
			counterText: "{x}/{y}",
			closeKeys: [27, 88, 67, 70],
			prevKeys: [37, 80],
			nextKeys: [39, 83]
		},
		blockUIConfig: {
			message: "<div class='lbLoading pwi_loader'>загружаю...</div>",
			css: "pwi_loader"
		},
		albumstore: "",
		photostore: "",
		token: ""
	};
})(jQuery);
