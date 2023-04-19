
(async () => {
  'use strict';
  const dayOfWeekStr = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
  //const titles = ["日付", "曜日", "レコード番号", "従業員番号", "処理月", "出勤", "退勤", "外出", "戻り", "稼働時間_時間", "時間内_時間", "残業時間_時間", "代休_時間", "休種", "備考"]
  let titles = ['処理月', '日付', '曜日', 'レコード番号', '従業員番号', '出勤', '退勤', '外出', '戻り', '外出2', '戻り2', '稼働時間_時間', '時間内_時間', '残業時間_時間', '代休_時間', '有給消費', '代休消費', '欠勤', '休種', '備考', '代休計算']
  let hidedTitles = []
  let yearInput //年を入力するテキストエリアの参照
  let monthInput //月を入力するテキストエリアの参照
  let numberInput //月を入力するテキストエリアの参照
  let tableBody //カレンダーのテーブルの参照
  let columns = {} //カレンダーの列操作の参照
  let allRecords //kintoneのレコード
  let numbersList = []
  let calendarData = []
  //祝日を取得
  let syukuzitu = new Array()
  let syukuzituDate = new Array()
  try {
    const res = await kintone.api('/k/v1/records.json', 'GET', { "app": "94" })
    syukuzitu = res.records;
    syukuzitu.forEach((a) => {
      syukuzituDate.push(a.日付.value)
    })
    console.log(res);
  } catch (e) {
    console.log(e);
    alert('祝日を取得できませんでした。ページを再読み込みしても復旧しない場合はシステム管理者にご確認ください。')
  }

  kintone.events.on('app.record.index.show', (event) => {
    //ビューIDを確認
    if (event.viewId !== 5522746) {
      return;
    }
    //レコードを取得
    allRecords = event.records;
    //従業員番号リストを作る
    allRecords.forEach((record) => {
      let number = record.従業員番号.value
      if (numbersList.indexOf(number) == -1) {
        numbersList.push(number)
      }
    })
    console.log(numbersList);
    console.log(allRecords);
    //    titles=Object.keys(records[0])
    //    console.log(titles);

    createMenu()
    createCalendar()

    CustomCalendar1(event.appId)
  });

  /**操作メニューを作る */
  function createMenu() {
    let headerMenuSpaceElement = kintone.app.getHeaderMenuSpaceElement()
    let menuSpace = headerMenuSpaceElement.appendChild(document.createElement('div'))
    menuSpace.id = "calendar_menu"
    let menuStyle = document.createElement('style')
    menuStyle.innerHTML = `
    #calendar_menu{
      height:100%;
      box-sizing:border-box;
    }
    #calendar_menu input,select,button{
      box-sizing: border-box;
      height: 100%;
      width: 80px;
      resize: none;
      overflow: hidden;
      vertical-align:middle;
      font-size: 1.3rem;

      border: 1px solid #3498db;
      background-color: #f7f9fa;
      margin-right:8px;
    }
    `
    //年
    let textarea = document.createElement('input')
    textarea.type = "number"
    textarea.step = "1"
    textarea.placeholder = "年"
    textarea.oninput = () => { CustomCalendar1(2) }
    yearInput = textarea
    //月
    let select = document.createElement('select')
    select.oninput = () => { CustomCalendar1(3) }
    const months = [
      { value: '01', name: "1月" }, { value: '02', name: "2月" }, { value: '03', name: "3月" }, { value: '04', name: "4月" }, { value: '05', name: "5月" }, { value: '06', name: "6月" }, { value: '07', name: "7月" }, { value: '08', name: "8月" }, { value: '09', name: "9月" }, { value: '10', name: "10月" }, { value: '11', name: "11月" }, { value: '12', name: "12月" }
    ];
    months.forEach(month => {
      const optionElement = document.createElement("option");
      optionElement.setAttribute("value", month.value);
      optionElement.textContent = month.name;
      select.appendChild(optionElement);
    });
    monthInput = select
    //社員番号
    let number = document.createElement('select')
    let optionElement = document.createElement('option')
    optionElement.setAttribute("value", '社員番号');
    optionElement.textContent = '社員番号';
    number.appendChild(optionElement);

    number.oninput = () => { CustomCalendar1('num') }

    console.log(numbersList);
    numbersList.forEach(num => {
      const optionElement = document.createElement("option");
      optionElement.setAttribute("value", num);
      optionElement.textContent = num;
      number.appendChild(optionElement);
    })
    numberInput = number
    /*    let number=document.createElement('input')
        number.type="text"
        number.placeholder='社員番号'
        numberInput=number
    */
    //表示ボタン
    let showButton = document.createElement('button')
    showButton.innerText = '表示'
    showButton.addEventListener("click", () => { CustomCalendar1(4) })

    //ダウンロードボタン
    let downloadButton = document.createElement('button')
    downloadButton.innerText = 'ダウンロード'
    downloadButton.onclick = download
    //表示列選択ボタン
    /*    let selectButton = document.createElement('button')
        selectButton.innerHTML = '行選択'
        let selectColumnArea = selectColumn()
        selectButton.addEventListener('click', () => {
          selectColumnArea.style.visibility = "visible"
        })
    */
    //初期値を設定
    let date = new Date()
    textarea.value = date.getFullYear()
    let month = date.getMonth() + 1
    month = month < 10 ? '0' + month : month;
    select.value = month;
    number.value = "社員番号"
    menuSpace.append(textarea, select, number, showButton, menuStyle, downloadButton)
  }
  /**カレンダーの土台を作成する */
  function createCalendar() {
    //カレンダーを生成
    let headerSpaceElement = kintone.app.getHeaderSpaceElement()
    let listArea = headerSpaceElement.appendChild(document.createElement('div'))
    listArea.id = 'calendar'
    let calendarStyle = document.createElement('style')
    calendarStyle.innerHTML = `
    #calendar td{text-align:center;}
    #calendar th{
      padding: 0 10px 0 10px;
      resize: horizontal;
      overflow: hidden;
    }
    #calendar .hidden{
      visibility: collapse;
    }
    `
    listArea.append(calendarStyle)

    let table = document.createElement('table')
    table.id = 'calendar_table'
    table.border = "1"
    listArea.append(table)

    titles.forEach((title) => {
      const col = document.createElement('col')
      columns[title] = col
      table.append(col)
    })
    //タイトル行を生成
    calendarData = [[]]
    let thead = document.createElement('thead')
    table.append(thead)
    const tr = document.createElement('tr')
    thead.append(tr)

    titles.forEach(function (title) {
      const th = document.createElement('th');
      th.innerText = title;
      th.addEventListener('dblclick', function () {
        console.log(this);
        let column = columns[this.innerText]
        column.classList.toggle('hidden')
      })
      tr.append(th);
      calendarData[0].push(title)
    })
    tableBody = table.appendChild(document.createElement('tbody'))
  }
  async function CustomCalendar1(appId) {
    const myRecordSpace = tableBody
    myRecordSpace.innerHTML = '';
    let year = yearInput.value
    let month = monthInput.value

//    const startDate=new Date(year,month,1)
//    const endDate = new Date(year, month, 0)// 月の最後の日を取得

    /*
        //従業員番号で絞り込む
        let number=numberInput.value
        let records
        if(number=="社員番号"){
          records=allRecords
        }else{
          records=allRecords.filter(record=>record.従業員番号.value==number)
        }
        console.log(records);
    */

    let records=[]
    try {
      console.log(luxon.DateTime.local());
      let start=luxon.DateTime.local(year,month,1)
      console.log(start.toISODate());
      let end=luxon.DateTime.local(year,month,0).toISODate()
      let query='日付 > "' +start+'" and 日付 < "'+end+'" and 従業員番号 = "'+numberInput.value+'"'
      console.log(query);

      const body = {
        app: appId,
        query: query,
        fields: ['レコード番号', '作成日時', 'ドロップダウン'],
      };

      records=await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body);
      
      console.log(records);
    } catch (e) {
      console.log(e);
      alert('レコードを取得できませんでした。ページを再読み込みしても復旧しない場合はシステム管理者にご確認ください。')
    }


    for (let i = 1; i <= new Date(year,month,0).getDate(); i++) {
      let date = "";
      if (i < 10) {
        date = year + "-" + month + "-0" + i;
      } else {
        date = year + "-" + month + "-" + i;
      }

      //日付のレコードを絞り込む
      let data = Array()
      records.forEach((record) => {
        if (record.日付.value == date) {
          data.push(record)
        }
      })

      //行を表示する
      if (data.length == 0) {
        let row = createRow(null, date, true)
        myRecordSpace.appendChild(row)
      } else {
        let row = createRow(data[0], date, true)
        myRecordSpace.appendChild(row)
        for (let j = 1; j < data.length; j++) {
          let row = createRow(data[j], date, false)
          myRecordSpace.appendChild(row)
        }
      }
    }
  }

  /**
   * 
   * @param {Object} data 行のデータ
   * @param {string} date 日付
   * @param {boolean} showDate 日付を表示するか
   */
  const recUrl = location.protocol + '//' + location.hostname + '/k/' + kintone.app.getId() + '/show#record=';

  function createRow(data, date, showDate) {
    let row = document.createElement('tr')
    row.style.height = "45px";
    let cells = {}
    titles.forEach(function (title) {
      cells[title] = row.insertCell();
    })

    let dateObj = new Date(date)
    const dayOfWeekNum = dateObj.getDay();
    if (showDate) {
      cells.日付.innerText = date
      const dayOfWeek = dayOfWeekStr[dayOfWeekNum];
      cells.曜日.innerText = dayOfWeek;
    }

    if (syukuzituDate.includes(date)) {
      cells["日付"].style.backgroundColor = '#ff9999'
      cells["曜日"].style.backgroundColor = '#ff9999'
    }
    if (new Date(date).getDay() == 0) {
      cells["日付"].style.backgroundColor = '#ff9999'
      cells["曜日"].style.backgroundColor = '#ff9999'
    }

    if (!data) { return row }


    //その他のセルの設定
    for (let i = 3; i < titles.length; i++) {
      try {
        cells[titles[i]].innerText = data[titles[i]].value;
      } catch (error) {
        cells[titles[i]].innerText = '!'
      }
    }
    //レコード番号
    let a = document.createElement('a');
    a.href = recUrl + data.レコード番号.value;
    a.innerText = data.レコード番号.value;
    cells["レコード番号"].innerHTML = ""
    cells["レコード番号"].appendChild(a);

    //休種、曜日によって背景色変更
    const rowsColor = [
      ["休種", "勤務", "#ffffff"],
      ["休種", "有給", "#ffcc66"],
      ["休種", "代休", "#ffcc66"],
      ["休種", "欠勤", "#ffcc66"],
    ]
    rowsColor.forEach(function (color) {
      if (data[color[0]].value == color[1]) {
        row.style.backgroundColor = color[2];
      }
      if (data['休種'].value != "勤務") {
        for (let i = 3; i < titles.length; i++) {
          cells[titles[i]].style.backgroundColor = "#ffcc66"
        }
        //        row.style.backgroundColor = color[2];
      }
    })
    return row;
  }
  function selectColumn() {
    let headerMenuSpaceElement = kintone.app.getHeaderMenuSpaceElement()
    let div = document.createElement('div')
    let style = div.appendChild(document.createElement('style'))
    style.innerHTML = `
    
    `
    headerMenuSpaceElement.appendChild(div)
    titles.forEach((title) => {
      let button = document.createElement('button')
      button.innerText = title
      div.append(button)
      button.addEventListener('click', (event) => {
        console.log(event.target);
        columns[event.target.innerText].classList.toggle('hidden')
      })
    })
    hidedTitles.forEach((title) => {
      let button = document.createElement('button')
      button.innerText = title
      div.append(button)
      button.addEventListener('click', (event) => {
        console.log(event.target);
        hidedTitles = hidedTitles.filter(item => item != event.target.innerText)
      })
    })
    headerMenuSpaceElement.append(div)
    return div
  }
  function download() {
    let table = document.getElementById('calendar_table')
    let filename = 'CalendarData'
    var escaped = /,|\r?\n|\r|"/;
    var e = /"/g;


    // データ作成
    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8BOMあり
    var csv = [], row = [], field, r, c;
    for (r = 0; r < table.rows.length; r++) {
      row.length = 0;
      for (c = 0; c < table.rows[r].cells.length; c++) {
        field = table.rows[r].cells[c].textContent;
        row.push(escaped.test(field) ? '"' + field.replace(e, '""') + '"' : field);
        // 区切り、改行、エスケープ文字を含む場合、エスケープ文字文字で囲む（エスケープ文字は二重にする）
      }
      csv.push(row.join(','));
    }
    //var blob = new Blob([/*bom, */csv.join('\n')], {'type': 'text/csv'}); // BOMなし
    var blob = new Blob([bom, csv.join('\n')], { 'type': 'text/csv' });

    // 保存
    if (window.navigator.msSaveBlob) {
      // IE用(保存 or 開く保存)
      window.navigator.msSaveBlob(blob, filename);
      //window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      let a = document.createElement('a');
      a.download = filename;
      a.href = window.URL.createObjectURL(blob);
      a.click()
    }
  }
})();
