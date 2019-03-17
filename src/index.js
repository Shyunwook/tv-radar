import $ from 'jquery';
import Vue from 'vue';
import Vuetify from 'vuetify';
import moment from 'moment';
import 'air-datepicker-en';
import 'p-loading'

import 'vuetify/dist/vuetify.min.css';
import 'air-datepicker-en/dist/css/datepicker.css';
import 'p-loading/dist/css/p-loading.css'

Vue.use(Vuetify);


const INIT_COUNT = 10;
const ADD_COUNT = 20;

$(document).ready(() => {
  $.fn.ploading.defaults = {
    useAddOns: ['plspinkit'],//we are calling the pl-spinkit by default
    spinner: 'rotatingPlane', //we are defining the rotatingPlane spinner as default,
    maskColor: 'rgba(1, 1, 1, 0.6)' //Change the mask color background to white as the spinners colors is black
  };

  $('.datepicker-here').datepicker({
    language: 'en',
    onHide: function(dp, animationCompleted) {
      if (!animationCompleted) {
        let start = dp.selectedDates[0];
        let end = dp.selectedDates[1];
        periodValidator(start, end);
      }
    }
  });
})

function periodValidator(start, end, tag) {
  let flag = true;
  let diff = moment(end).diff(moment(start), 'days');
  let future_flag = moment(end).diff(moment(), 'times');
  let today_flag = moment(end).diff(moment(), 'days');

  console.log(future_flag);
  if (diff > 31) {
    alert('최대 한 달까지만 조회가 가능합니다😭😭(업데이트 예정)');
    $('.datepicker-here').val("");
    flag = false;
  } else if (future_flag > 0 || (end && today_flag === 0)) {
    console.log(future_flag);
    alert('전 일까지의 데이터만 조회가 가능합니다')
    $('.datepicker-here').val("");
    flag = false;
  }
  if (tag == 'click') {
    return flag;
  }
}

function sortByWeightedMin(grouped_data) {
  console.log(grouped_data);
  grouped_data.sort((a, b) => {
    return b.weighted_min - a.weighted_min;
  })
}

function bottomVisible(position){
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
  props: ['other_name_gruop_data', 'gs_name_gruop_data'],
  data: () => ({
    gs_view_data : [],
    filtered_gs_data : [],
    offsetTop : 0,
    pagination: {
      sortBy: 'weighted_min',
      descending: true
    },
    selected: [],
    headers: [{
        text: '순위',
        value: '',
        width: "10"
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
  watch : {
    gs_name_gruop_data : function(val) {
      this.filtered_gs_data = JSON.parse(JSON.stringify(val));

      this.gs_view_data = this.filtered_gs_data.splice(0,INIT_COUNT);
    },
    gs_view_data : function(){
      this.$nextTick(function() {
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
      return this.other_name_gruop_data.filter(d => {
        return Object.keys(this.filters).every(f => {
          return this.filters[f].length < 1 || this.filters[f].includes(d[f]);
        })
      })
    }
  },
  methods: {
    gsDataHandler(option){
      if(option === "select"){
        $('.gs_table_box').scrollTop(0);
        this.filtered_gs_data = this.gs_name_gruop_data.filter(d => {
          return this.filters['category'] == '' || this.filters['category'] == d['category'] || this.filters['category'] == undefined
        });
        if(this.filtered_gs_data.length >= INIT_COUNT){
          this.gs_view_data = this.filtered_gs_data.splice(0,INIT_COUNT);
        }else{
          this.gs_view_data = JSON.parse(JSON.stringify(this.filtered_gs_data));
        }

      }else{
        let push_count = 0;

        if(this.filtered_gs_data.length>=ADD_COUNT){
          push_count = ADD_COUNT;
        }else{
          push_count = this.filtered_gs_data.length;
        }

        for(let i = 0; i < push_count; i ++){
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
      if(bottomVisible(this.offsetTop)){
        this.gsDataHandler('scroll');
      }
    }
  },
})

let otherRank = Vue.component('other-rank-component', {
  template: "#otherRankTemplate",
  props: ['other_name_gruop_data'],
  data: () => ({
    pagination: {
      sortBy: 'weighted_min',
      descending: true
    },
    selected: [],
    headers: [{
        text: '순위',
        value: '',
        width: "300px"
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
      brand: [],
      category: []
    }
  }),
  computed: {
    filteredRankItem() {
      return this.other_name_gruop_data.filter(d => {
        return Object.keys(this.filters).every(f => {
          return this.filters[f].length < 1 || this.filters[f].includes(d[f])
        })
      })
    }
  },
  methods: {
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
    }
  }
})

let gsRank = Vue.component('gs-rank-component', {
  template: "#gsRankTemplate",
  props: ['gs_name_gruop_data', 'selected_category', 'selected_shop'],
  methods: {
    categotyCheck: function(category) {
      if (category === this.selected_category || this.selected_category === "all") return true;
      else return false;
    },
  }
});

let clist = new Vue({
  el: '#app',
  data: {
    other_name_gruop_data: [],
    gs_name_gruop_data: [],
    selected_category: "all",
    selected_shop: ["hnsmall", "cjmall", "lottemall", "immall", "nsmall", "ssgshop", "hmallplus", "kshop", "cjmallplus", "lotteonetv", "shopnt", "wshop", "bshop", "nsmallplus", "hmall"],
    current_page: 1,
    show_modal: false,
    history: [],
    page: 1,

  },
  components: {
    otherRank: otherRank,
    gsRank: gsRank,
    allRank: allRank
  },
  methods: {
    getData: function() {
      $('body').ploading({
        action: 'show'
      });

      let period = ($('.datepicker-here').val()).split(' ~ ');
      let flag = periodValidator(period[0], period[1], "click");

      if (flag == true) {
        $.ajax({
          url: "/getScheduleData",
          type: "POST",
          dataType: "json",
          data: {
            dateFrom: period[0],
            dateTo: period[1]
          },
          success: (data) => {
            console.log(data.result);
            let other_data = data.other_grouped_weight_data;
            console.log(other_data);
            let gs_data = data.gs_grouped_weight_data;

            this.gs_name_gruop_data = gs_data;
            sortByWeightedMin(this.gs_name_gruop_data);

            this.other_name_gruop_data = other_data;

            $('.shop_category').css('display', 'flex');

            $('body').ploading({
              action: 'hide'
            });
          },
          error: (e) => {
            console.error(e);
            // $.hideLoading();
          }
        })
      }
    }
  }
})
