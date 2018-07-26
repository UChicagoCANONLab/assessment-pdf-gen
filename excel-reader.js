var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

function handleExFile(e) {
	NAME_LIST = [];
	var files = e.target.files, f = files[0];
  var type_list = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
	if(type_list.indexOf(excel.files[0].type) == -1) {
		excelError();
    return;
  }
	var reader = new FileReader();
	reader.onload = function(e) {
		var data = e.target.result;
		if(!rABS) data = new Uint8Array(data);
		var workbook = XLSX.read(data, {type: rABS ? 'binary' : 'array'});
		NAME_LIST = readNames(workbook);
		console.log(NAME_LIST);
		
		/* DO SOMETHING WITH workbook HERE */
	};
	if(rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
}

function readNames(workbook) {
	var worksheet = workbook.Sheets[workbook.SheetNames[0]];
	var json_list = XLSX.utils.sheet_to_json(worksheet, {header:"A"});
	return json_list.map(x => x.A);
}

function excelError() {
  document.getElementById("process_status").style.color = "red";
  document.getElementById('process_status').innerHTML = "Error: must be XLS or XLSX file.";
}