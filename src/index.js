import $ from 'jquery';
import Vue from 'vue';
import Vuetify from 'vuetify';
import moment from 'moment';
import schedule, { setWeekDays } from './schedule.js';
import 'air-datepicker-en';
import 'p-loading';
import 'bootstrap';

import 'bootstrap/dist/css/bootstrap.css';
import 'vuetify/dist/vuetify.min.css';
import 'air-datepicker-en/dist/css/datepicker.css';
import 'p-loading/dist/css/p-loading.css';

Vue.use(Vuetify);

const INIT_COUNT = 10;
const ADD_COUNT = 20;
const SCHEDULE_ROUTE = 'schedule';
let down_data = [];

$(document).ready(() => {

  setHeaderBtn();

  $.fn.ploading.defaults = {
    useAddOns: ['plspinkit'],//we are calling the pl-spinkit by default
    spinner: 'rotatingPlane', //we are defining the rotatingPlane spinner as default,
    maskColor: 'rgba(1, 1, 1, 0.6)' //Change the mask color background to white as the spinners colors is black
  };

  schedule();

  $('.multiselect.dropdown-toggle.btn.btn-default').append(`<i aria-hidden="true" class="v-icon material-icons theme--light">keyboard_arrow_down</i>`);

  if (window.location.href.substr(window.location.href.lastIndexOf('/') + 1) === SCHEDULE_ROUTE) {
    let period = setWeekDays(moment());
    $('.schedule_datepicker').val(moment().format('YYYY-MM-DD'));
    $('.selected_period').text(`${moment(period.start).format("YYYY년 MM월 DD일")} ~ ${moment(period.end).format("YYYY년 MM월 DD일")}`);
    $('.selected_period').data('date', `${moment(period.start).format('YYYY-MM-DD')} ~ ${moment(period.end).format('YYYY-MM-DD')}`);
    // $('.get_schedule').trigger('click');
  }

  $('.target_link').on('click', function () {
    window.location.replace('/target');
  });

  $('.schedule_link').on('click', function () {
    window.location.replace('/schedule');
  })

  $('.home_link').on('click', function () {
    window.location.replace('../');
  })

  $('.datepicker-here').datepicker({
    language: 'en',
    onHide: function (dp, animationCompleted) {
      if (!animationCompleted) {
        let start = dp.selectedDates[0];
        let end = dp.selectedDates[1];
        periodValidator(start, end);
      }
    }
  });

})

function setHeaderBtn() {
  let route = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
  if (route == 'target') {
    $('.target_link').removeClass('header_menu');
    $('.target_link').addClass('header_menu_hover');
    $('.schedule_link').removeClass('header_menu_hover');
    $('.schedule_link').addClass('header_menu');
  } else if (route == 'schedule') {
    $('.schedule_link').removeClass('header_menu');
    $('.schedule_link').addClass('header_menu_hover');
    $('.target_link').removeClass('header_menu_hover');
    $('.target_link').addClass('header_menu');
  } else {
    $('.target_link').removeClass('header_menu_hover');
    $('.target_link').addClass('header_menu');
    $('.schedule_link').removeClass('header_menu_hover');
    $('.schedule_link').addClass('header_menu');
  }
}


function convertToCSV(objArray) {
  var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';

  for (var i = 0; i < array.length; i++) {
    var line = '';
    for (var index in array[i]) {
      if (line != '') line += ','

      line += array[i][index];
    }

    str += line + '\r\n';
  }

  return str;
}

function exportCSVFile(headers, items, fileTitle) {
  if (headers) {
    items.unshift(headers);
  }

  // Convert Object to JSON
  var jsonObject = JSON.stringify(items);

  var csv = convertToCSV(jsonObject);

  var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

  var blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8,\uFEFF' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilenmae);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function download(filter, gs_data) {
  var headers = {
    name: '방송명',
    brand: "브랜드",
    shop: "경쟁사",
    real_min: "사용분",
    weighted_min: "가중분",
    category: "카테고리",
    count: "방송횟수"
  };
  var itemsNotFormatted = [...down_data];
  var itemsFormatted = [];

  if(filter === "가전·디지털"){
    headers.division = "세분류";
  }

  // format the data
  itemsNotFormatted.forEach((item) => {
    itemsFormatted.push({
      name: item.name.replace(/,/g, ''), // remove commas to avoid errors,
      brand: item.brand,
      shop: item.shop,
      real_min: item.real_min,
      weighted_min: item.weighted_min,
      category: item.category,
      count: item.count
    });

    if(filter === "가전·디지털"){
      itemsFormatted[itemsFormatted.length - 1].division = item.division;
    }

  });
  var fileTitle = 'orders'; // or 'my-unique-title'
  exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download
}

function periodValidator(start, end, tag) {
  let flag = true;
  let diff = moment(end).diff(moment(start), 'months');
  let future_flag = moment(end).diff(moment(), 'times');
  let today_flag = moment(end).diff(moment(), 'days');

  if (end === undefined) {
    alert('기간을 선택해주세요!!');
    $('.datepicker-here').val("");
    flag = false;
  } else if (diff >= 3) {
    alert('최대 세 달까지 조회가 가능합니다');
    $('.datepicker-here').val("");
    flag = false;
  } else if (future_flag > 0 || (end && today_flag === 0)) {
    alert('전 일까지의 데이터만 조회가 가능합니다')
    $('.datepicker-here').val("");
    flag = false;
  }

  if (tag == 'click') {
    return flag;
  }
}

function sortByWeightedMin(grouped_data) {
  grouped_data.sort((a, b) => {
    return b.weighted_min - a.weighted_min;
  })
}

function bottomVisible(position) {
  let scrollY = position;
  // var visible = document.documentElement.clientHeight;
  // var pageHeight = document.documentElement.scrollHeight;
  let visible = $('.gs_table_box').height();
  let pageHeight = $('.gs_table').height();

  let bottomOfPage = visible + scrollY >= pageHeight;
  return bottomOfPage || pageHeight < visible;
}

let allRank = Vue.component('rank-component', {
  template: "#rankTemplate",
  // props: ['other_name_gruop_data', 'gs_name_gruop_data'],
  data: () => ({
    other_name_gruop_data: [],
    gs_name_gruop_data: [],
    download: false,
    gs_view_data: [],
    filtered_gs_data: [],
    offsetTop: 0,
    pagination: {
      sortBy: 'weighted_min',
      descending: true
    },
    selected: [],
    headers: [{
      text: '순위',
      value: '',
      width: "1%"
    },
    {
      text: '경쟁사',
      value: 'shop',
      width: "1%"
    },
    {
      text: '이미지',
      value: 'img',
      width: "1%"
    },
    {
      text: '브랜드',
      value: 'brand',
      width: "1%"
    },
    {
      text: '방송명',
      value: 'name',
      width: "1%"
    },
    {
      text: '사용분',
      value: 'real_min',
      width: "1%"
    },
    {
      text: '가중분',
      value: 'weighted_min',
      width: "1%"
    },
    {
      text: '방송횟수',
      value: 'count',
      width: "1%"
    }
    ],
    filters: {
      shop: [],
      category: ''
    },
    gs_filters: {
      category: ''
    },
    dialog: {}
  }),
  watch: {
    gs_name_gruop_data: function (val) {
      this.filtered_gs_data = JSON.parse(JSON.stringify(this.gs_name_gruop_data));

      this.gs_view_data = this.filtered_gs_data.splice(0, INIT_COUNT);
    },
    gs_view_data: function () {
      this.$nextTick(function () {
        let g_count = $('.gs_table tr').length - 1;
        for (let i = 1; i <= g_count; i++) {
          $($($('.gs_table tr')[i]).find('.replacement')[0]).html(i);
        }
      })
    }
  },
  computed: {
    filteredRankItem() {
      if (this.filters["category"] === undefined) {
        this.filters["category"] = '';
      }

      let filtered_other_data = this.other_name_gruop_data.filter(d => {
        return Object.keys(this.filters).every(f => {
          return this.filters[f].length < 1 || this.filters[f].includes(d[f]);
        })
      });

      down_data = filtered_other_data;

      return filtered_other_data;
    }
  },
  methods: {
    test : function(props){
      let name = props.item.name;

      $.ajax({
        url: '/readDic',
        method: 'get',
        success: (data) => {
          let list = data.split('\n');
          list.forEach((v, i) => {
            if(name.indexOf(v) > -1) console.log(v);
          })
        }
      });
    },
    selectText: function () {
      this.$nextTick(function () {
        console.log(this.filters.shop.length);
        let num_p = $('.target_shop_select .v-select__selections .shop_number_text');
        if (this.filters.shop.length >= 3) {
          $('.target_content .target_shop_select .v-select__selection--comma').hide();
          if ($(num_p).length === 0) {
            let ele = `<p class="shop_number_text">${this.filters.shop.length}개 선택됨</p>`
            $('.target_shop_select .v-select__selections').append(ele);
          } else {
            $(num_p).text(`${this.filters.shop.length}개 선택됨`);
            $(num_p).show();
          }
        } else {
          $('.target_content .target_shop_select .v-select__selection--comma').show();
          if ($(num_p).length > 0) {
            $(num_p).hide();
          }
        }
      })
    },
    getData: function () {
      $('body').ploading({
        action: 'show'
      });

      let period = ($('.datepicker-here').val()).split(' ~ ');
      let flag = periodValidator(period[0], period[1], "click");

      if (flag == true) {
        $.ajax({
          url: "/getTargeteData",
          type: "POST",
          dataType: "json",
          data: {
            dateFrom: period[0],
            dateTo: period[1]
          },
          success: (data) => {
            let date = $('.datepicker-here').val();
            console.log(date);
            let start = date.split(' ~ ')[0];
            let end = date.split(' ~ ')[1];
            start = moment(start).format("YYYY년 MM월 DD일");
            end = moment(end).format("YYYY년 MM월 DD일");
            $('.selected_period').text(`${start} ~ ${end}`);
            console.log(start, end);
            $('.datepicker-here').val('');

            let other_data = data.other_grouped_weight_data;
            let gs_data = data.gs_grouped_weight_data;

            // down_data = other_data;
            down_data = [...other_data, ...gs_data];

            this.gs_name_gruop_data = gs_data;
            sortByWeightedMin(this.gs_name_gruop_data);

            // this.other_name_gruop_data = other_data;
            this.other_name_gruop_data = down_data;

            $('.shop_category').css('display', 'flex');

            $('body').ploading({
              action: 'hide'
            });

            this.download = true;
          },
          error: (e) => {
            console.error(e);
            // $.hideLoading();
          }
        })
      }
    },
    gsDataHandler(option) {
      if (option === "select") {
        $('.gs_table_box').scrollTop(0);
        this.filtered_gs_data = this.gs_name_gruop_data.filter(d => {
          return this.filters['category'] == '' || this.filters['category'] == d['category'] || this.filters['category'] == undefined
        });
        if (this.filtered_gs_data.length >= INIT_COUNT) {
          this.gs_view_data = this.filtered_gs_data.splice(0, INIT_COUNT);
        } else {
          this.gs_view_data = JSON.parse(JSON.stringify(this.filtered_gs_data));
        }

      } else {
        let push_count = 0;

        if (this.filtered_gs_data.length >= ADD_COUNT) {
          push_count = ADD_COUNT;
        } else {
          push_count = this.filtered_gs_data.length;
        }

        for (let i = 0; i < push_count; i++) {
          this.gs_view_data.push(this.filtered_gs_data.shift());
        }
      }
    },
    toggleAll() {
      if (this.selected.length) this.selected = []
      else this.selected = this.other_name_gruop_data.slice()
    },
    changeSort(column) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending
      } else {
        this.pagination.sortBy = column
        this.pagination.descending = false
      }
    },
    columnValueList(val) {
      return this.other_name_gruop_data.map(d => d[val])
    },
    onScroll(e) {
      this.offsetTop = e.target.scrollTop
      if (bottomVisible(this.offsetTop)) {
        this.gsDataHandler('scroll');
      }
    },
    excelDownload: function () {
      download(this.filters.category, this.filtered_gs_data);
    },
    // 특정 기간 데이터 엑셀로 받기 위한 API
    // periodDataDown: function(){ 
    //   $.ajax({
    //     url : '/getPeriodData/2019-07-01&2019-08-13',
    //     method : 'get',
    //     success : function(data){
    //       console.log(data);
    //       var headers = {
    //         name: '방송명',
    //         shop: "방송사",
    //         category: "카테고리",
    //         date : "방송날짜",
    //         start_time : "시작시간",
    //         end_tiem : "종료시간",
    //         price : "가격",
    //         link : "링크"
    //       };
    //       var itemsNotFormatted = data;
    //       var itemsFormatted = [];

    //       // format the data
    //       itemsNotFormatted.forEach((item) => {
    //           itemsFormatted.push({
    //               name: item.item.replace(/,/g, ''), // remove commas to avoid errors,
    //               shop: item.shop,
    //               category: item.category,
    //               date : item.date,
    //               start_time : item.start_time,
    //               end_time : item.end_time,
    //               price : item.price.replace(/,/gi,'').replace('원',''),
    //               link : item.link
    //           });
    //       });

    //       var fileTitle = 'orders'; // or 'my-unique-title'

    //       exportCSVFile(headers, itemsFormatted, fileTitle);
    //     }
    //   });
    // }
  },
})

let clist = new Vue({
  el: '#app',
  data: {
    selected_category: "all",
    selected_shop: ["hnsmall", "cjmall", "lottemall", "immall", "nsmall", "ssgshop", "hmallplus", "kshop", "cjmallplus", "lotteonetv", "shopnt", "wshop", "bshop", "nsmallplus", "hmall"],
    show_modal: false,
    history: [],
  },
  components: {
    allRank: allRank
  }
})