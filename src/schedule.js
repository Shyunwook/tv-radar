import moment from 'moment';
import '@atomaras/bootstrap-multiselect';

const ITEM_HEIGHT = 96;

export default function schedule() {

	const TIME = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17',
		'18', '19', '20', '21', '22', '23'];

	const DEFAULT_SHOP = ['cjmall', 'lottemall', 'hnsmall', 'hmall', 'nsmall'];
	const DEFAULT_CATEGORY = "all"

	let raw_data;
	let target_shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
	let target_category = DEFAULT_CATEGORY;

	$('.schedule_datepicker').datepicker({
		language: 'en',
		onHide: function (dp, animationCompleted) {
			// if (!animationCompleted) {
			// 	let day = dp.selectedDates[0];
			// 	let period = setWeekDays(day);
			//
			// 	$('.selected_period').text(`${period.start} ~ ${period.end}`);
			//
			// 	$('.schedule_datepicker').val("");
			// 	// getData(period.start, period.end);
			// 	$('.get_schedule').trigger('click');
			// }
		}
	});

	$('.shop_select').multiselect({
		buttonWidth: '230px',
		onChange: function (option, checked, select) {
			let val = option[0].value;
			if (checked) {
				target_shop.push(val);
			} else {
				let idx = target_shop.indexOf(val);
				if (idx > -1) {
					target_shop.splice(idx, 1);
				}
			}

			let dateFrom = $($('.events-group')[0]).find('.top-info').data('date');
			let dateTo = $($('.events-group')[$('.events-group').length - 1]).find('.top-info').data('date');

			let filtered = shopCategoryFilter(raw_data);
			drawSchedule(filtered, dateFrom, dateTo);
		},
		buttonText: function (options, select) {
			if (options.length === 0) {
				return '경쟁사 선택';
			}
			else if (options.length > 3) {
				return `${options.length}개 선택됨`;
			}
			else {
				var labels = [];
				options.each(function () {
					if ($(this).attr('label') !== undefined) {
						labels.push($(this).attr('label'));
					}
					else {
						labels.push($(this).html());
					}
				});
				return labels.join(', ') + '';
			}
		}
	});

	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	var transitionsSupported = ($('.csstransitions').length > 0);
	//if browser does not support transitions - use a different event to trigger them
	if (!transitionsSupported) transitionEnd = 'noTransition';

	//should add a loding while the events are organized

	function SchedulePlan(element) {
		this.element = element;
		this.timeline = this.element.find('.timeline');
		this.timelineItems = this.timeline.find('li');
		this.timelineItemsNumber = this.timelineItems.length;
		this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
		//need to store delta (in our case half hour) timestamp
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

		this.eventsWrapper = this.element.find('.events');
		this.eventsGroup = this.eventsWrapper.find('.events-group');
		this.singleEvents = this.eventsGroup.find('.single-event');
		this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
		this.modal = this.element.find('.event-modal');
		this.modalHeader = this.modal.find('.header');
		this.modalHeaderBg = this.modal.find('.header-bg');
		this.modalBody = this.modal.find('.body');
		this.modalBodyBg = this.modal.find('.body-bg');
		this.modalMaxWidth = 800;
		this.modalMaxHeight = 480;

		this.animating = false;

		this.initSchedule();
	}

	SchedulePlan.prototype.initSchedule = function () {
		this.scheduleReset();
		this.initEvents();
	};

	SchedulePlan.prototype.scheduleReset = function () {
		var mq = this.mq();
		if (mq == 'desktop' && !this.element.hasClass('js-full')) {
			//in this case you are on a desktop version (first load or resize from mobile)
			this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
			// this.element.addClass('js-full');
			this.placeEvents();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} else if (mq == 'mobile' && this.element.hasClass('js-full')) {
			//in this case you are on a mobile version (first load or resize from desktop)
			this.element.removeClass('js-full loading');
			this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
			this.eventsWrapper.children('.grid-line').remove();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} else if (mq == 'desktop' && this.element.hasClass('modal-is-open')) {
			//on a mobile version with modal open - need to resize/move modal window
			this.checkEventModal('desktop');
			this.element.removeClass('loading');
		} else {
			this.element.removeClass('loading');
		}
	};

	SchedulePlan.prototype.initEvents = function () {
		var self = this;

		this.singleEvents.each(function () {
			//create the .event-date element for each event
			var durationLabel = '<span class="event-date">' + $(this).data('start') + ' - ' + $(this).data('end') + '</span>';
			$(this).children('a').append($(durationLabel));

			//detect click on the event and open the modal
			$(this).on('click', 'a', function (event) {
				// console.log($(this).data('link'));
				// window.open($(this).data('link'));
				if (!self.animating) self.openModal($(this));
				// event.preventDefault();
			});
		});

		//close modal window
		this.modal.on('click', '.close', function (event) {
			event.preventDefault();
			if (!self.animating) self.closeModal($(document).find('.selected-event'));
		});

		this.element.on('click', '.cover-layer', function (event) {
			if (!self.animating && self.element.hasClass('modal-is-open')) self.closeModal($(document).find('.selected-event'));
		});
	};

	SchedulePlan.prototype.placeEvents = function () {
		var self = this;
		this.singleEvents.each(function () {
			//place each event in the grid -> need to set top position and height
			var start = getScheduleTimestamp($(this).attr('data-start')),
				duration = getScheduleTimestamp($(this).attr('data-end')) - start;

			var eventTop = self.eventSlotHeight * (start - self.timelineStart) / self.timelineUnitDuration;
			var eventHeight = self.eventSlotHeight * duration / self.timelineUnitDuration;

			$(this).css({
				position: 'relative',
				height: ITEM_HEIGHT + 'px'
			})

			if ($(this).parent('div').attr('class') != undefined) {
				var cl = $(this).parent('div').attr('class');
				var t = cl.split('-')[1];
				var eventTop = $(`.pa-${t}`).position().top;
			}


			$(this).parent('div').css({
				height: `${ITEM_HEIGHT * $(this).parent('div').children().length}px`,
				position: 'absolute',
				top: (eventTop - 51) + 'px',
				width: '100%'
			});

		});

		this.element.removeClass('loading');
	};

	SchedulePlan.prototype.openModal = function (event) {
		var self = this;
		var mq = self.mq();
		this.animating = true;
		//update event name and time
		this.modalHeader.find('.event-name').text(event.find('.event-name').text());
		this.modalHeader.find('.event-date').text(event.find('.event-date').text());
		this.modalHeader.attr('class', `header ${event.parent().data('shop')}`);
		this.modal.attr('data-event', event.parent().attr('data-event'));

		//update event content
		// this.modalBody.find('.event-info').load(event.parent().attr('data-content')+'.html .event-info > *', function(data){
		// 	//once the event content has been loaded
		// 	self.element.addClass('content-loaded');
		// });
		// this.modalBody.find('.event-info').append(`<p>what the !!!</p>`);


		this.element.addClass('modal-is-open');

		setTimeout(function () {
			//fixes a flash when an event is selected - desktop version only
			event.parent('li').addClass('selected-event');
			getLowerItem(self);
		}, 10);

		if (mq == 'mobile') {
			self.modal.one(transitionEnd, function () {
				self.modal.off(transitionEnd);
				self.animating = false;
			});
		} else {
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = (windowWidth * .8 > self.modalMaxWidth) ? self.modalMaxWidth : windowWidth * .8,
				modalHeight = (windowHeight * .8 > self.modalMaxHeight) ? self.modalMaxHeight : windowHeight * .8;

			var modalTranslateX = parseInt((windowWidth - modalWidth) / 2 - eventLeft),
				modalTranslateY = parseInt((windowHeight - modalHeight) / 2 - eventTop);

			var HeaderBgScaleY = modalHeight / eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			//change modal height/width and translate it
			self.modal.css({
				top: eventTop + 'px',
				left: eventLeft + 'px',
				height: modalHeight + 'px',
				width: modalWidth + 'px',
			});
			transformElement(self.modal, 'translateY(' + modalTranslateY + 'px) translateX(' + modalTranslateX + 'px)');

			//set modalHeader width
			self.modalHeader.css({
				width: eventWidth + 'px',
			});
			//set modalBody left margin
			self.modalBody.css({
				marginLeft: eventWidth + 'px',
			});

			//change modalBodyBg height/width ans scale it
			self.modalBodyBg.css({
				height: eventHeight + 'px',
				width: '1px',
			});
			transformElement(self.modalBodyBg, 'scaleY(' + HeaderBgScaleY + ') scaleX(' + BodyBgScaleX + ')');

			//change modal modalHeaderBg height/width and scale it
			self.modalHeaderBg.css({
				height: eventHeight + 'px',
				width: eventWidth + 'px',
			});
			transformElement(self.modalHeaderBg, 'scaleY(' + HeaderBgScaleY + ')');

			self.modalHeaderBg.one(transitionEnd, function () {
				//wait for the  end of the modalHeaderBg transformation and show the modal content
				self.modalHeaderBg.off(transitionEnd);
				self.animating = false;
				self.element.addClass('animation-completed');
			});
		}

		//if browser do not support transitions -> no need to wait for the end of it
		if (!transitionsSupported) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	};

	SchedulePlan.prototype.closeModal = function (event) {
		var self = this;
		var mq = self.mq();

		this.animating = true;

		if (mq == 'mobile') {
			this.element.removeClass('modal-is-open');
			this.modal.one(transitionEnd, function () {
				self.modal.off(transitionEnd);
				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		} else {
			console.log(event)
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var modalTop = Number(self.modal.css('top').replace('px', '')),
				modalLeft = Number(self.modal.css('left').replace('px', ''));

			var modalTranslateX = eventLeft - modalLeft,
				modalTranslateY = eventTop - modalTop;

			self.element.removeClass('animation-completed modal-is-open');

			//change modal width/height and translate it
			this.modal.css({
				width: eventWidth + 'px',
				height: eventHeight + 'px'
			});
			transformElement(self.modal, 'translateX(' + modalTranslateX + 'px) translateY(' + modalTranslateY + 'px)');

			//scale down modalBodyBg element
			transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
			//scale down modalHeaderBg element
			transformElement(self.modalHeaderBg, 'scaleY(1)');

			this.modalHeaderBg.one(transitionEnd, function () {
				//wait for the  end of the modalHeaderBg transformation and reset modal style
				self.modalHeaderBg.off(transitionEnd);
				self.modal.addClass('no-transition');
				setTimeout(function () {
					self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
				}, 10);
				setTimeout(function () {
					self.modal.removeClass('no-transition');
				}, 20);

				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		}

		//browser do not support transitions -> no need to wait for the end of it
		if (!transitionsSupported) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);

		this.modalBody.find('.event-info').children().remove();
	}

	SchedulePlan.prototype.mq = function () {
		//get MQ value ('desktop' or 'mobile')
		var self = this;
		return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
	};

	SchedulePlan.prototype.checkEventModal = function (device) {
		this.animating = true;
		var self = this;
		var mq = this.mq();

		if (mq == 'mobile') {
			//reset modal style on mobile
			self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
			self.modal.removeClass('no-transition');
			self.animating = false;
		} else if (mq == 'desktop' && self.element.hasClass('modal-is-open')) {
			self.modal.addClass('no-transition');
			self.element.addClass('animation-completed');
			var event = self.eventsGroup.find('.selected-event');

			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = (windowWidth * .8 > self.modalMaxWidth) ? self.modalMaxWidth : windowWidth * .8,
				modalHeight = (windowHeight * .8 > self.modalMaxHeight) ? self.modalMaxHeight : windowHeight * .8;

			var HeaderBgScaleY = modalHeight / eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			setTimeout(function () {
				self.modal.css({
					width: modalWidth + 'px',
					height: modalHeight + 'px',
					top: (windowHeight / 2 - modalHeight / 2) + 'px',
					left: (windowWidth / 2 - modalWidth / 2) + 'px',
				});
				transformElement(self.modal, 'translateY(0) translateX(0)');
				//change modal modalBodyBg height/width
				self.modalBodyBg.css({
					height: modalHeight + 'px',
					width: '1px',
				});
				transformElement(self.modalBodyBg, 'scaleX(' + BodyBgScaleX + ')');
				//set modalHeader width
				self.modalHeader.css({
					width: eventWidth + 'px',
				});
				//set modalBody left margin
				self.modalBody.css({
					marginLeft: eventWidth + 'px',
				});
				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.css({
					height: eventHeight + 'px',
					width: eventWidth + 'px',
				});
				transformElement(self.modalHeaderBg, 'scaleY(' + HeaderBgScaleY + ')');
			}, 10);

			setTimeout(function () {
				self.modal.removeClass('no-transition');
				self.animating = false;
			}, 20);
		}
	};

	// $(window).keyup(function(event) {
	// 	if (event.keyCode == 27) {
	// 		objSchedulesPlan.forEach(function(element){
	// 			element.closeModal(element.eventsGroup.find('.selected-event'));
	// 		});
	// 	}
	// });

	function checkResize() {
		objSchedulesPlan.forEach(function (element) {
			element.placeEvents();
		});
		windowResize = false;
	}

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g, '');
		var timeArray = time.split(':');
		// var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);

		var timeStamp = parseInt(timeArray[0]) * 60;
		return timeStamp;
	}

	function transformElement(element, value) {
		element.css({
			'-moz-transform': value,
			'-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	}

	function getData(start, end) {
		$('.events-group').remove();
		$('body').ploading({
			action: 'show'
		});
		let dateFrom = moment(start).format("YYYY-MM-DD");
		let dateTo = moment(end).format("YYYY-MM-DD");

		$.ajax({
			url: "https://fy2b0csnq7.execute-api.us-west-2.amazonaws.com/prod/vaccine-c-api",
			type: 'POST',
			data: JSON.stringify({ dateFrom: dateFrom, dateTo: dateTo }),
			contentType: 'application/json',
			success: function (data) {
				console.log(data);
				target_shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));

				$('.cd-schedule').show();
				raw_data = JSON.parse(JSON.stringify(data));

				let filtered = shopCategoryFilter(raw_data);
				drawSchedule(filtered, dateFrom, dateTo);
				$('.schedule_excel').show();
				$('.schedule_category').show();
				$('.schedule_shop').show();
				$('.schedule_datepicker').val("");
				filterActivate();
			},
			error: function (e) {
				console.log(e);
			}
		});
	}

	function filterActivate() {
		$('.category_select').prop('disabled', false);
		$('.shop_select').prop('disabled', false);
		$('.schedule_shop button').prop('disabled', false);
		$('.schedule_shop button').removeClass('disabled');

		$('.category_select option[value="all"]').prop('selected', true);
		let leng = $('.multiselect-container').children().length;

		for (let i = 0; i < leng; i++) {
			let target = $('.multiselect-container').children()[i];
			if (DEFAULT_SHOP.indexOf($(target).find('input').val()) > -1 && !$(target).hasClass('active')) {
				$(target).find('label').trigger('click');
			} else if (DEFAULT_SHOP.indexOf($(target).find('input').val()) === -1 && $(target).hasClass('active')) {
				$(target).find('label').trigger('click');
			}
		}

		target_shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
		$('body').ploading({
			action: 'hide'
		});
	}

	function shopCategoryFilter(data) {
		let temp = data.filter((val) => {
			return target_shop.indexOf(val.shop) > -1 &&
				(val.category === target_category || target_category === "all");
		})
		return temp;
	}

	function classifyScheduleData(data, schedule) {
		data.forEach((item) => {
			let start_index = item.start_time.split(":")[0];
			schedule[item.date][start_index].push(item);
		})
	}

	function setTimelineHeight(schedule) {
		TIME.forEach((val) => {
			let max = 0;

			Object.keys(schedule).forEach((date) => {
				if (max < schedule[date][val].length) {
					max = schedule[date][val].length;
				}
			})

			let height = max * ITEM_HEIGHT;
			$(`.pa-${val}`).css({
				height: height > 0 ? height : ITEM_HEIGHT
			});
		})
	}

	function setScheduleData(schedule, SchedulePlan) {

		Object.keys(schedule).forEach((date) => {
			let day = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
			let day_flag = moment(date).day();

			let content =
				`<li class="events-group">
			<div class="top-info" data-date="${date}"><span>${moment(date).format('MM/DD')} ${day[day_flag]}</span></div>
			<ul>`;

			Object.keys(schedule[date]).forEach((time) => {
				content += `<div class="ch-${time}">`;
				schedule[date][time].forEach((item) => {
					let li =
						`<li class="single-event ${item.shop}" data-start="${item.start_time}" data-end="${item.end_time}"  data-content="${item.item}" data-event="event-3"
					data-shop="${item.shop}">
					<a href="#0" data-link="${item.link}">
					<em class="event-name"><img src="img/badge/${item.shop}.svg">${item.item}</em>
					<em class="price_text">${item.price.length < 3 || item.price.length === undefined ? '' : item.price}</em>
					<em class="event-price" style="display:none">${item.price}</em>
					<em class="event-shop" style="display:none">${item.shop}</em>
					<span>${(item.lower===undefined||item.lower.length <= 0)?"" : "**있음**"}</span>
					</a>
					</li>`;
					content += li;
				})
				content += `</div>`
			})

			content +=
				`</ul>
			</li>`;

			$('.event_day').append(content);
			$('.events-group').css({
				height: $('.timeline ul').height() + 50
			})
		})

		var schedules = $('.cd-schedule');
		var objSchedulesPlan = [];

		if (schedules.length > 0) {
			schedules.each(function () {
				//create SchedulePlan objects
				objSchedulesPlan.push(new SchedulePlan($(this)));
			});
		}
	}

	function periodValidator(start, end, callback) {
		let diff = moment(end).diff(moment(start), 'days');
		if (diff > 6) {
			alert('최대 일주일간의 편성표만 조회 가능합니다.');
			$('.schedule_datepicker').val("");
		}
	}

	function drawSchedule(data, dateFrom, dateTo) {
		$('.events-group').remove();
		let time_obj = {};
		let schedule = {};
		let period = [];
		let day = dateFrom;

		let diff = moment(dateTo).diff(dateFrom, "days");
		for (let i = 0; i <= diff; i++) {
			period.push(moment(day).format("YYYY-MM-DD"));
			day = moment(day).add(1, 'days');
		}

		TIME.forEach((time) => {
			time_obj[time] = [];
		})

		period.forEach((date) => {
			schedule[date] = JSON.parse(JSON.stringify(time_obj));
		})

		classifyScheduleData(data, schedule);
		setTimelineHeight(schedule);
		setScheduleData(schedule, SchedulePlan);
	}

	function getLowerItem(self) {
		let target = $('.cd-schedule').find('.selected-event');
		let date = $(target).parent().parent().siblings('.top-info').data('date');
		date = moment(date).format('YYYYMMDD');
		let name = $(target).data('content');
		$.ajax({
			url: "/getLowerItem",
			type: "POST",
			data: {
				name: name,
				date: date
			},
			success: (data) => {
				console.log(data);
				console.log(typeof(data))
				let content = "";
				if(typeof(data)==="object"){
					content = makeModalContent(data);
				}
				self.modalBody.find('.event-info').append(content);
			}
		})
	}

	function makeModalContent(data){
		let content = ``;
		data.forEach(val => {
			content += `<img src="${val.img}"><p>${val.name}</p><p>${val.price}</p>`;
		})
		return content;
	}

	$('.schedule_excel').on('click', function () {
		let time_obj = {};
		TIME.forEach((time) => {
			time_obj[time] = {};
		})

		let time_col = $('.timeline ul li');
		let event_group = $('.events-group');

		for (let i = 0; i < time_col.length; i++) { // 시간 줄
			let target = $(time_col[i]).attr('class').split('-')[1];

			let max = 0;
			for (let j = 0; j < event_group.length; j++) { // 각 시간에 해당하는 div
				let target_div = $(event_group[j]).find(`.ch-${target}`);

				if (max < $(target_div).find('li').length) {
					max = $(target_div).find('li').length;
				}

			}

			// for(let m = 0; m < max; m ++){
			// 	time_obj[target][m] = [];
			// }
			time_obj[target] = [];

			if (max == 0) {
				let temp_arr = [];
				for (let j = 0; j < event_group.length; j++) {
					temp_arr.push({});
				}
				time_obj[target].push(temp_arr);
			} else {
				for (let i = 0; i < max; i++) {
					let temp_arr = [];
					for (let j = 0; j < event_group.length; j++) { // 각 시간에 해당하는 div
						let target_div = $(event_group[j]).find(`.ch-${target}`);
						let li = $(target_div).find('li');
						if (li[i] != undefined) {
							temp_arr.push({
								name: $(li[i]).find('.event-name').text(),
								shop: $(li[i]).data('shop'),
								price: $(li[i]).find('.event-price').text(),
								time: `${$(li[i]).data('start')} ~ ${$(li[i]).data('end')}`
							});
						} else {
							temp_arr.push({});
						}
					}
					time_obj[target].push(temp_arr);
				}
			}

		}
		console.log(time_obj);


		//---------------------------------------------------------
		// 레이아웃 만들기 시작
		let dateFrom = $($('.events-group')[0]).find('.top-info').data('date');
		let dateTo = $($('.events-group')[$('.events-group').length - 1]).find('.top-info').data('date');
		let period = [];
		let day = dateFrom;

		let diff = moment(dateTo).diff(dateFrom, "days");
		for (let i = 0; i <= diff; i++) {
			period.push(moment(day).format("YYYY-MM-DD"));
			day = moment(day).add(1, 'days');
		}

		let day_obj = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };

		let content = `<table id="export" style="display:none">`;

		content += `<tr>`;
		content += `<th>시간</th>`;
		period.forEach((date) => {
			let day_flag = moment(date).day();
			content += `<th>${moment(date).format('MM/DD')} ${day_obj[day_flag]}</th>`;
		})
		content += `</tr>`;

		let time = Object.keys(time_obj).sort();
		let colors = {
			cjmall: "#fffca4",
			hmall: "#a2b9b2",
			hnsmall: "#9c9dd0",
			lottemall: "#e8b478",
			nsmall: "#da9497"
		}

		time.forEach((val) => {
			content += `<tr>`;
			content += `<td rowspan=${time_obj[val].length}>${val}00</td>`;
			time_obj[val][0].forEach((td) => {
				content += `<td class="${td.shop}" style="background: ${colors[td.shop] ? colors[td.shop] : 'white'}">${td.time ? td.time + ' / ' : ''}${td.shop ? '(' + td.shop + ')' : ''}${td.name ? td.name : ''}&nbsp&nbsp${td.price ? td.price : ''}</td>`;
			})
			content += `</tr>`;
			for (let i = 1; i < time_obj[val].length; i++) {
				content += `<tr>`;
				time_obj[val][i].forEach((td) => {
					content += `<td class="${td.shop}" style="background: ${colors[td.shop] ? colors[td.shop] : 'white'}">${td.time ? td.time + ' / ' : ''}${td.shop ? '(' + td.shop + ')' : ''}${td.name ? td.name : ''}&nbsp&nbsp${td.price ? td.price : ''}</td>`;
				})
				content += `</tr>`;
			}
		})
		content += `</table>`


		$('.excel_table').append(content);

		tableToExcel('export', '편성');
		$('#export').remove();
		//---------------------------------------------------------
	});

	$('.category_select').on('change', function () {
		let cate = $(this).val();

		let dateFrom = $($('.events-group')[0]).find('.top-info').data('date');
		let dateTo = $($('.events-group')[$('.events-group').length - 1]).find('.top-info').data('date');

		target_category = cate;
		let filtered = shopCategoryFilter(raw_data);
		drawSchedule(filtered, dateFrom, dateTo);
	})

	$('.get_schedule').on('click', function () {
		$('.schedule_excel').hide();
		$('.schedule_select').hide();
		$('.cd-schedule').hide();
		$('.events-group').remove();

		let period = setWeekDays(moment($('.schedule_datepicker').val()));
		$('.selected_period').text(`${moment(period.start).format("YYYY년 MM월 DD일")} ~ ${moment(period.end).format("YYYY년 MM월 DD일")}`);
		$('.selected_period').data('date', `${moment(period.start).format('YYYY-MM-DD')} ~ ${moment(period.end).format('YYYY-MM-DD')}`);
		console.log(moment(period.start).format("YYYY년 MM월 DD일"));
		getData(period.start, period.end);
	})

	$('.pre_week').on('click', function () {
		target_category = DEFAULT_CATEGORY;

		let temp = $('.selected_period').text();
		temp = temp.replace(/년 /gi, '-');
		temp = temp.replace(/월 /gi, '-');
		temp = temp.replace(/일/gi, '');

		let period = temp.split(' ~ ');
		let start = moment(period[0]).add(-7, 'days').calendar('YYYY-MM-DD');
		let end = moment(period[1]).add(-7, 'days').calendar('YYYY-MM-DD');

		$('.selected_period').text(`${moment(start).format('YYYY년 MM월 DD일')} ~ ${moment(end).format('YYYY년 MM월 DD일')}`);
		$('.selected_period').data('date', `${moment(start).format('YYYY-MM-DD')} ~ ${moment(end).format('YYYY-MM-DD')}`);

		$('.schedule_excel').hide();
		$('.schedule_select').hide();
		$('.cd-schedule').hide();
		$('.events-group').remove();

		getData(moment(start).format('YYYY-MM-DD'), moment(end).format('YYYY-MM-DD'));
	})

	$('.next_week').on('click', function () {
		target_category = DEFAULT_CATEGORY;

		let temp = $('.selected_period').text();
		temp = temp.replace(/년 /gi, '-');
		temp = temp.replace(/월 /gi, '-');
		temp = temp.replace(/일/gi, '');

		let period = temp.split(' ~ ');
		console.log(period);
		let start = moment(period[0]).add(7, 'days').calendar('YYYY-MM-DD');
		let end = moment(period[1]).add(7, 'days').calendar('YYYY-MM-DD');
		$('.selected_period').text(`${moment(start).format('YYYY년 MM월 DD일')} ~ ${moment(end).format('YYYY년 MM월 DD일')}`);
		$('.selected_period').data('date', `${moment(start).format('YYYY-MM-DD')} ~ ${moment(end).format('YYYY-MM-DD')}`);

		$('.schedule_excel').hide();
		$('.schedule_select').hide();
		$('.cd-schedule').hide();
		$('.events-group').remove();

		getData(moment(start).format('YYYY-MM-DD'), moment(end).format('YYYY-MM-DD'));
	})

	var tableToExcel = (function () {
		var uri = 'data:application/vnd.ms-excel;base64,'
			, template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
			, base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
			, format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
		return function (table, name) {
			if (!table.nodeType) table = document.getElementById(table)
			var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }
			window.location.href = uri + base64(format(template, ctx))
		}
	})()
}

export function setWeekDays(day) {
	let d = moment(day).day();
	let start = moment(day).add((-d + 1), 'days').calendar('YYYY-MM-DD');
	let end = moment(day).add((7 - d), 'days').calendar('YYYY-MM-DD');

	start = moment(start).format('YYYY-MM-DD');
	end = moment(end).format('YYYY-MM-DD');

	return { start: start, end: end };
}

// export default schedule, {setWeekDays};
