/**
 * Picasa Webalbum Integration jQuery plugin
 * This library was inspired aon pwa by Dieter Raber
 * @name jquery.pwi.js
 * @author Jeroen Diderik - http://www.multiprof.nl/
 * @revision 1.0.31
 * @date June 01, 2009
 * @copyright (c) 2009 Jeroen Diderik(www.multiprof.nl)
 * @license Creative Commons Attribution-Share Alike 3.0 Netherlands License - http://creativecommons.org/licenses/by-sa/3.0/nl/
 * @Visit http://pwi.googlecode.com/ for more informations, duscussions etc about this library
 */
 
(function($){
 	$.fn.pwi = function(options) {
		var pg;
		this.each(function() {
			pg = $.data(this, "pwi");
			if( pg ) return false;
			new $.pwiGallery(this, options);
		});
		return pg || this;
	};

	$.pwi = {
		version: "1.0.31",
		setDefaults: function(options){
			$.extend(defaults, options);
		}
	};

	// set default options
	var defaults = {
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
		maxResults: 50,
		thumbSize: 72,
		thumbCrop: 0,
		thumbCss: {'margin' : '5px'},
		onclickThumb: "",
		showAlbumTitles: true,
		showAlbumDate: true,
		showAlbumPhotoCount: true,
		showAlbumDescription: true,
		showAlbumLocation: true,
		showSlideshowLink: true,
		showPhotoCaption: false,
		showPhotoDate: true,
		labels: {photo:"photo",
				photos: "photos",
				albums: "Back to albums",
				slideshow: "Display slideshow",
				loading: "PWI fetching data...",
				page: "Page",
				prev: "Previous",
				next: "Next",
				devider: "|"
		},
		months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
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
			message: "<div class='lbLoading pwi_loader'>loading...</div>",
			css: "pwi_loader"
		},
		albumstore: "",
		photostore: "",
		token: ""
	};
			

	$.pwiGallery = function(el, options){
		
		var $self, thisgallery = this, settings;
		settings = $.extend({}, defaults, options);
		$self = $(el);
		$self.addClass('pwi_container');
		
		if(settings.username == ''){
			alert('Make sure you specify at least your username.'+'\n'+'See http://pwi.googlecode.com for more info');
			return;
		}
		
		switch (settings.mode){
			case 'latest':
				getLatest();
				break;
			default:
				$.historyInit(fromHistory);
				break;
		};
		
		function StringCat() {
			var sp,ep,l = 0;
			this.push = function(what) {
				if (typeof(sp) == 'undefined') {
					ep = new Array();
					sp = ep;
				} else {
					var oep = ep;
					ep = new Array();
					oep[1] = ep;
				}
				ep[0] = what; ++l;
			};
			this.toString = function() {
				if (l == 0) return;
				while (l > 1) {
					var ptr = sp,
						nsp = new Array(),
						nep = nsp,
						nl = 0;
					while (typeof(ptr) != 'undefined') {
						if (typeof(nep[0]) == 'undefined') {
							nep[0] = ptr[0]; ++nl;
						} else {
							if (typeof(ptr[0]) != 'undefined') nep[0] += ptr[0];
							nep[1] = new Array();
							nep = nep[1];
						};
						ptr = ptr[1];
					};
					sp = nsp;
					ep = nep;
					l = nl;
				};
				return sp[0];
			};
		};

		function formatDate($dt) {
			var $today = new Date(Number($dt)),
				$year = $today.getYear();
			if ($year < 1000) {
				$year += 1900;
			};
			return ($today.getDate() + " " +settings.months[($today.getMonth())] + " " + $year);
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
			var $scAlbums = new StringCat();
			for (var i = 0; i < j.feed.entry.length; i++) {
				var $id_base = j.feed.entry[i].gphoto$name.$t,
					$album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t),
					$thumb = j.feed.entry[i].media$group.media$thumbnail[0].url.replace(new RegExp("/s160-c/", "g"), "/");
				if($.inArray($id_base, settings.albums) > -1 || settings.albums.length==0){
						
					$scAlbums.push("<div class='pwi_album'><a class='standard' href='#' onclick='javascript:$.historyLoad(\"" + settings.username + "/" + $id_base + "/1\");return false;' title='"+j.feed.entry[i].title.$t+"'>");
					$scAlbums.push("<img src='" + $thumb + "?imgmax=" + settings.albumThumbSize + "&crop=" + settings.albumCrop + "'/><br>");
					settings.showAlbumTitles ? $scAlbums.push("<a href='#' onclick='javascript:$.historyLoad(\"" + settings.username + "/" + $id_base + "/1\");return false;'>" + j.feed.entry[i].title.$t + "</a><br/>" + (settings.showAlbumDate ? $album_date : "") + ( settings.showAlbumPhotoCount ? "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " "+ settings.labels.photos : "")) : false;
					$scAlbums.push("</div>");
				}
			};
			$scAlbums.push("<div style='clear: both;height:0px;'> </div>");
			settings.albumstore = $scAlbums.toString();
			show(false, settings.albumstore);
		}
		
		function album(j) {
			var $scPhotos = new StringCat(),
				$np = j.feed.openSearch$totalResults.$t,
				$loc = j.feed.gphoto$location.$t == "undefined" ? "" : j.feed.gphoto$location.$t,
				$ad = j.feed.subtitle.$t == "undefined" ? "" : j.feed.subtitle.$t,
				$album_date = formatDate(j.feed.gphoto$timestamp.$t),
				$item_plural = ($np == "1") ? false : true,
				$len = j.feed.entry.length;
			settings.albumTitle = j.feed.title.$t == "undefined" ? settings.albumTitle : j.feed.title.$t;
			$scPhotos.push("<div class='pwi_album_description'>");
			if (settings.mode != 'album') $scPhotos.push("<a href='#' onclick='$.historyLoad(\"\");return false;'>" + settings.labels.albums + "</a> &gt; " + settings.albumTitle + "<br/>");
			if (settings.showAlbumDescription) {
				$scPhotos.push("<div class='title'>" + settings.albumTitle + "</div>");
				$scPhotos.push("<div class='details'>" + $np + " " + ($item_plural ? settings.labels.photos : settings.labels.photo) + (settings.showAlbumDate ? ", " + $album_date: "") + (settings.showAlbumLocation && $loc ? ", " + $loc: "") + "</div>");
				$scPhotos.push("<div class='description'>" + $ad + "</div>");
				if (settings.showSlideshowLink) $scPhotos.push("<a href='http://picasaweb.google.com/" + settings.username + "/" + j.feed.gphoto$name.$t + "/photo#s" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new' class='sslink'>" + settings.labels.slideshow + "</a>");
			};
			$scPhotos.push("</div>");
			if ($np > settings.maxResults) {
				$pageCount = ($np / settings.maxResults);
				var $ppage = settings.labels.prev + " " + settings.labels.devider + " ",
					$npage = settings.labels.devider + " " + settings.labels.next,
					$navRow = new StringCat();
				if (settings.page > 1) {
					$ppage = "<a href='#' onclick='$.historyLoad(\"" + settings.username + "/" + settings.album + "/" + (parseInt(settings.page) - 1) + "\");return false;'>" + settings.labels.prev + "</a> | "
				};
				if (settings.page < $pageCount) {
					$npage = "| <a href='#' onclick='$.historyLoad(\"" + settings.username + "/" + settings.album + "/" + (parseInt(settings.page) + 1) + "\");return false;'>" + settings.labels.next + "</a>"
				};
				$navRow.push("<div class='pwi_pager'>" + $ppage + settings.labels.page + " ");
				for (var i = 1; i < $pageCount + 1; i++) {
					if (i == settings.page) {
						$navRow.push("<span class='pwi_pager_current'>" + i + "</span> ");
					} else {
						$navRow.push("<a href='#' onclick='$.historyLoad(\"" + settings.username + "/" + settings.album + "/" + i + "\");return false;'>" + i + "</a> ");
					};
				};
				$navRow.push($npage + "</div>");
				$scPhotos.push($navRow.toString());
			};
			for (var i = 0; i < $len; i++) {
				var $img_base = j.feed.entry[i].content.src,
					$id_base = j.feed.entry[i].gphoto$id.$t,
					$c = (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: ""),
					$dt = settings.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : formatDateTime(j.feed.entry[i].gphoto$timestamp.$t) ) : "",
					$d = $c.replace(new RegExp("'", "g"), "&#39;") + " " + $dt;
				$scPhotos.push("<div class='pwi_photo' style='height:" + (settings.thumbSize+1) + "px;'>");
				$scPhotos.push("<a href='" + $img_base + "?imgmax=" + settings.photoSize + "' rel='lb-"+settings.username+"' title='" + $d + "'>");
				$scPhotos.push("<img src='" + $img_base + "?imgmax=" + settings.thumbSize + "&crop=" + settings.thumbCrop + "'/></a>");
				if(settings.showPhotoCaption) $scPhotos.push("<br/>"+$c);
				$scPhotos.push("</div>");
		};
			$scPhotos.push($navRow);
			$scPhotos.push("<div style='clear: both;height:0px;'> </div>"); 
			settings.photostore = $scPhotos.toString();
			show(false, settings.photostore);

			var $s = $(".pwi_photo");
			$s.css(settings.thumbCss);
			if(typeof(settings.onclickThumb) != "function" && $.slimbox){
				$s.find("a[rel='lb-"+settings.username+"']").slimbox(settings.slimbox_config);
			}else if(typeof(settings.onclickThumb) == "function"){
				$s.find("a[rel='lb-"+settings.username+"']").bind('click',clickThumb);
			}
		};
		
		function latest(j) {
			var $scPhotos = new StringCat(),
				$len = j.feed.entry.length ? j.feed.entry.length  : 0;
			for (var i = 0; i < $len; i++) {
				var $img_base = j.feed.entry[i].content.src,
					$id_base = j.feed.entry[i].gphoto$id.$t,
					$c = settings.showPhotoCaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "",
					$dt = settings.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : formatDateTime(j.feed.entry[i].gphoto$timestamp.$t) ) : "",
					$d = $c.replace(new RegExp("'", "g"), "&#39;") + " " + $dt;
				
				$scPhotos.push("<div class='pwi_photo' >");
				$scPhotos.push("<a href='" + $img_base + "?imgmax=" + settings.photoSize + "' rel='lb-"+settings.username+"' title='" + $d + "'>");
				$scPhotos.push("<img src='" + $img_base + "?imgmax=" + settings.thumbSize + "&crop=" + settings.thumbCrop + "'/></a>");
				$scPhotos.push("<br/>"+$c);
				$scPhotos.push("</div>");
			}
			$scPhotos.push("<div style='clear: both;height:0px;'> </div>");

			show(false, $scPhotos.toString());

			var $s = $("div.pwi_photo").css(settings.thumbCss);
			if(typeof(settings.onclickThumb) != "function" && $.slimbox){
				$s.find("a[rel='lb-"+settings.username+"']").slimbox(settings.slimbox_config);
			}else if(typeof(settings.onclickThumb) == "function"){
				$s.find("a[rel='lb-"+settings.username+"']").bind('click',clickThumb);
			}
		};
		
		function clickThumb(){
			settings.onclickThumb.call(this);
			return false;
		};
		
		function getAlbums() {
			if (settings.albumstore!="") {
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
				$url = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username + '/album/' + settings.album + '?kind=photo&max-results=' + settings.maxResults + '&start-index=' + $si + '&alt=json' + ((settings.authKey!="") ? "&authkey="+settings.authKey : "");
			show(true, '');
			$.getJSON($url, 'callback=?', album);
			return $self;
		};

		function getLatest() {
			show(true, '');
			var $url = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username + (settings.album!="" ? '/album/'+settings.album : '') + '?kind=photo&max-results=' + settings.maxResults + '&alt=json&q=' + ((settings.authKey!="") ? "&authkey="+settings.authKey : "");
			$.getJSON($url, 'callback=?', latest);
			return $self;
		};

		function fromHistory($hash) {
			if ($hash) {
				if ($hash.split("/").length > 2) {
					settings.username = $hash.split("/")[0];
					settings.album = $hash.split("/")[1];
					settings.page = $hash.split("/")[2];
					getAlbum();
				}else if ($hash.split("/").length > 1) {
					settings.album = $hash.split("/")[0];
					settings.page = $hash.split("/")[1];
					getAlbum();
				};
	;
			}else if(settings.album != '' && settings.mode == 'album'){
				getAlbum();
			}else{
				getAlbums();
			};
		};

		function show(loading, data) {
			if (loading) {
				if($.blockUI) $self.block(settings.blockUIConfig);
			} else {
				if($.blockUI) $self.unblock();
				$self.html(data);
			};
		};
	};
})(jQuery);
