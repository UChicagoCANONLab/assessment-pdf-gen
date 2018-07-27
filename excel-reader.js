var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

function handleExFile(e) {
  document.getElementById('excel').blur();

	NAME_LIST = [];
	var files = e.target.files, f = files[0];
  console.log(excel.files[0].name.split('.').pop());

	if(!excelTypeCheck(excel.files[0])) {
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

function excelTypeCheck(file) {
  if(['xlsx','xls'].indexOf(file.name.split('.').pop()) == -1) {
    document.getElementById("process_status").style.color = "red";
    document.getElementById('process_status').innerHTML = "Error: Excel document must be XLS or XLSX file.";
    return false;
  }
  return true;
}