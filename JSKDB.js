
/**
 * JSKDB
 * @version 3.0.0
 * @authors Kevin Lucich
 */
var JSKDB = function( debug_level ){

	var self = this;
	var databases = {};
	var db_used = null;

	JSKDB.prototype.version = '3.0.0';
	JSKDB.prototype.debug_level = (typeof debug_level !== 'undefined') ? (''+debug_level).toUpperCase() : JSKDB.prototype.Log.NONE;


	//	Create a structure of contenier of databases in "localStorage"
	if( typeof localStorage === 'undefined' ){
		JSKDB.prototype.Log.error("Error: your browser don't support localStorage");
		return;
	}

	//	If is the first JSKDB run, create the JSKDB object in localStorage
	if( typeof localStorage['JSKDB'] === 'undefined' ){
		localStorage['JSKDB'] = JSON.stringify({});
	}

	//	Recupero dal localStorage (attenzione, tiro su un Object Semplice! quindi devo convertire)
	databases = JSON.parse(localStorage['JSKDB']);

	if( KUtils.objSize(databases) > 0 ){
		for( var d in databases ){
			var db = databases[d];
			// Create a DB
			var new_db = new JSKDB.prototype.KDatabase( db.db_name, db.version );
			// Create Tables
			for( var t in db.tables ){
				var table = db.tables[t];
				//	The data will be imported automaticaly! :D
				if( table.columns == undefined && table.column != undefined ){
					table.columns = table.column;
					delete( table.column );
				}
				new_db.createTable( table.table_name, table.columns, table.keys );
			}
			databases[d] = new_db;
		}
	}

	//	Catch "databases" and save in localStorage - da usare tutte le volte che viene modificato qualcosa
	self.saveDatabases = function(){
		localStorage['JSKDB'] = JSON.stringify( databases );
		if( self.debug ){
			JSKDB.prototype.Log.info("Databases saved in localStorage.");
		}
	};

	self.existsDatabase = function( db_name ){
		return (typeof databases[db_name] !== 'undefined');
	};

	//	Create a new database
	self.createDatabase = function( db_name, version, struct ){

		if( typeof version === 'undefined' )
			version = 1.0;

		if( typeof db_name === 'undefined' ){
			if( self.debug ){
				JSKDB.prototype.Log.error("Error: db_name is empty.");
			}
			return false;
		}

		if( self.existsDatabase(db_name) ){
			if( self.debug ){
				JSKDB.prototype.Log.error("Error: database \""+ db_name +"\" already exists.");
			}
			//	Controllo la versione, se la versione risulta più recente devo modificare le informazioni del DB :)
			if( parseFloat(version) > parseFloat(databases[db_name]['version']) ){
				alert('DEVO AGGIORNARE LA STRUTTURA! (DOVREI FARLO IN QUESTA VERSIONE) :( ');
			}
			return;
		}

		//	Save new database
		databases[ db_name ] = new JSKDB.prototype.KDatabase(db_name, version, struct);
		self.saveDatabases();
	};

	self.use = function( _db_used ){

		if( typeof databases[ _db_used ] === 'undefined' ){
			if( self.debug ){
				JSKDB.prototype.Log.error("Error: database \""+ _db_used +"\" not found. Create it before you can use.");
			}
			return;
		}

		db_used = _db_used;
		if( self.debug ){
			JSKDB.prototype.Log.info("Database changed");
		}
	};

	self.existsTable = function( table_name ){
		return (databases[db_used]).existsTable(table_name);
	};

	/**
	 * Create a new table in the database that you are using
	 * @param	table_name	String			The name of table
	 * @param	columns		Array			Columns of table
	 * @param	keys		String|Array	Primary keys of table (must be present into columns!)
	 * @return	JSKDB.prototype.KTable
	 */
	var time_for_saveDatabases = 0;
	self.createTable = function( table_name, columns, keys ){
		var t = (databases[ db_used ]).createTable( table_name, columns, keys );

		//	Update the localStorage after 2 seconds the last "createTable" invocation, so don't overwrite the database in localStorage saved! :@
		clearTimeout( time_for_saveDatabases );
		time_for_saveDatabases = setTimeout(function(){
			self.saveDatabases();
		}, 2000);

		return t;
	};

	/**
	 * Insert data into table in the database that you are using
	 * @param	table_name	String		The name of table
	 * @param	data		Array|Object	Columns of table
	*/
	self.insertData = function( table_name, data ){
		ChronoMe.start('insertData');
		var self = this;
		(databases[ db_used ]).insertData( table_name, data );
		self.saveDatabases();
		JSKDB.prototype.Log.info('[insertData] time = '+ ChronoMe.stop('insertData') +' ms' );
	};

	/**
	 * Insert data into table in the database that you are using
	 * @param	table_name			String			The name of table
	 * @param	data_to_update		Array|Object	Columns of table
	*/
	self.updateData = function( table_name, data_to_update, where ){
		var self = this;
//		(databases[ db_used ]).updateData( table_name, data_to_update, where );
//		self.saveDatabases();
	};

/**
	Delete data from table in the database that you are using
	@param	table_name	String		The name of table
	@param	where		Array|Object	Columns of table
	@return	void
*/
	self.deleteData = function( table_name, where ){
		var self = this;
//		(databases[ db_used ]).deleteData( table_name, where );
//		self.saveDatabases();
	};

/**
	eturns the data contained in table which meet the characteristics of passed
	@param	table_name	String			The name of table
	@param	where		Object|Array		Map of characteristics or array of Primary Keys
	@return	Object
*/
	self.select = function( table_name, where ){
		ChronoMe.start('select');
		var r = (databases[ db_used ]).select( table_name, where );
		JSKDB.prototype.Log.info('['+ table_name +'.select] Time = '+ ChronoMe.stop('select') );
		return r;
	};

	/**
	 * Delete all data from table in the database that you are using
	 * @param	table_name		String		The name of table
	*/
	self.truncate = function( table_name ){
		var self = this;
		(databases[ db_used ]).truncate( table_name );
		self.saveDatabases();
	};

	/**
	 * Delete all data from all table in the database that you are using
	*/
	self.clear = function(){
		var tables = databases[ db_used ]['tables'];
		for( var t in tables ){
			self.truncate( t );
		}
		self.saveDatabases();
	};
};

JSKDB.prototype.Log = {

	'NONE': 'NONE',
	'INFO': 'INFO',
	'ERROR': 'ERROR',
	'VERBOSE': 'VERBOSE',


	'inDebugMode': function( mode ){
		return (mode.toUpperCase() == JSKDB.prototype.debug_level );
	},

	'log': function( str ){
		if( (JSKDB.prototype.debug_level == 'VERBOSE') || (JSKDB.prototype.debug_level == 'INFO') ){
			console.log( 'JSDKB Log:', str );
		}
	},
	'info': function( str ){
		if( (JSKDB.prototype.debug_level == 'VERBOSE') || (JSKDB.prototype.debug_level == 'INFO') ){
			console.info( '%c JSDKB Info:', 'font-weight: bold;', str );
		}
	},
	'warn': function( str ){
		if( (JSKDB.prototype.debug_level == 'VERBOSE') || (JSKDB.prototype.debug_level == 'INFO') ){
			console.warn( '%c JSDKB Warning:', 'font-weight: bold;', str );
		}
	},
	'error': function( str ){
		if( (JSKDB.prototype.debug_level == 'VERBOSE') || (JSKDB.prototype.debug_level == 'ERROR') ){
			console.error( '%c JSDKB Error:', 'font-weight: bold;', str );
		}
	}
};


//////////////////////////////////////////////////////
//	KTable

JSKDB.prototype.KTable = function( table_name, columns, keys ){

	var self = this;
	self.table_name = table_name;
	self.data = {};
	self.columns = [];
	self.keys = undefined;
	self.auto_increment = 0;	//	Auto increment, used for key of data array

	//	Map of Primary key of table
	self.PK = {};

	self.statistics = {
		'select': {'last': 0, 'total': 0},
		'insert': {'last': 0, 'total': 0},
		'update': {'last': 0, 'total': 0},
		'delete': {'last': 0, 'total': 0}
	};

	if( columns.constructor != Array ){
		JSKDB.prototype.Log.error("Error: colums is not array");
		return;
	}else{
		self.columns = columns;
	}


	if( typeof keys !== 'undefined' ){
		switch( keys.constructor ){
			case Array:
				self.keys = keys;
				break;
			case Object:
				self.keys = KUtils.obj2Array(keys);
				break;
			default:
				self.keys = [keys];
				break;
		}

		if( !KUtils.inArray(self.keys,columns) ){
			JSKDB.prototype.Log.warn('keys ['+ self.keys.join(',') +'] not in colums ['+ columns.join(',') +'], key non set');
		}

		var keys_len = (self.keys).length;
		for( var p=0; p<keys_len; p++ ){
			self.PK[ self.keys[p] ] = {};
		}
	}

	/**
	 * @return	{Boolean}	True if a primary keys are setted
	 */
	var is_PK_setted = function(){
		return (typeof self.keys !== 'undefined');
	};

	var walkData = function( array, callback ){
		for( var a in array ){
			callback.apply( self, [array[a]] );
		}
	};

	var fromObjGetColumnsAccepted = function( row ){
		var _row = {},
			ColumnsLen = self.columns.length;
		for( var c=0; c<ColumnsLen; c++ ){
			var column = self.columns[c];
			_row[ column ] = (typeof row[column] !== 'undefined') ? row[column] : null;
		}
		return _row;
	};

	var updateStatistics = function( key, value ){
		self.statistics[key]['last'] = value;
		self.statistics[key]['total'] += self.statistics[key]['last'];
	};

	/**
	 * __filter( row, where )
	 * @param	row		Object	A row of table
	 * @param	where	Object	A map with value
	 * @return	{Boolean}	True if row has carateristics in "where"
	 */
	var __filter = function( row, where ){

		if( typeof row === 'undefined' || typeof where === 'undefined' ){
			return false;
		}
		//	Any row will be accepted
		if( where.constructor == Boolean ){
			return true;
		}

		//	Any row will be accepted
		if( where.constructor == Object ){
			for( var w in where ){
				if( typeof row[w] === 'undefined' ){
					continue;
				}
				var filter_value = where[w];
				switch( filter_value.constructor ){
					case Array:
						return KUtils.inArray( row[k], filter_value );
						break;
					default:
						return ( row[w] == filter_value );
						break;
				}
			}
		}
		return false;
	};

	/**
	 * Set data of table
	 * @param	data_to_import	Object	The data to set into table
	 */
	self.importData = function( data_to_import ){
		self.data = data_to_import;
	};

	/**
	 * Insert data into table
	 * @param	rows_to_insert	Object|Array		Array of object to insert, if Object passed it will cast into Array
	 */
	self.insertData = function( rows_to_insert ){

		var tmp_n_inserted = 0,
			row_duplicate_not_insert = [];

		if( typeof rows_to_insert === 'undefined' ){
			if( self.debug ){
				JSKDB.prototype.Log.error("Error to insert data into table \""+ self.table_name +"\": data is undefiend");
			}
			return false;
		}

		//	For permits a multi-insert, if the data is Object ( one row in table ), i will convert in Array of one element :)
		if( rows_to_insert.constructor == Object ){
			rows_to_insert = new Array(rows_to_insert);
		}

		walkData( rows_to_insert, function( row ){

			var Table = this,
				p=null,
				c=null;

			var id_row = ( is_PK_setted() ) ? row[self.keys[0]] : self.auto_increment;

			if( is_PK_setted() ){

				if( typeof Table.data[ id_row ] !== 'undefined' ){
					row_duplicate_not_insert.push( id_row );
					return false;
				}

				var keys_len = (self.keys).length;
				for( p=1; p<keys_len; p++ ){
					var pk = self.keys[p];
					//	Check if the primary key already exists
					if( typeof Table.PK[pk][ row[pk] ] !== 'undefined' ){
						row_duplicate_not_insert.push( id_row );
						return false;
					}
				}
			}


			//	Increse auto_increment counter
			self.auto_increment++;

			//	Add association ;)
			for( var p=1; p<keys_len; p++ ){
				var pk = self.keys[p];
				//	If the row don't exists, add a association
				Table.PK[pk][ row[pk] ] = id_row;
			}

			Table.data[ id_row ] = fromObjGetColumnsAccepted( row );

			tmp_n_inserted++;
		});

		if( row_duplicate_not_insert.length ){
			JSKDB.prototype.Log.warn('keys already exists. Data not insert: [ '+ row_duplicate_not_insert.join(', ') +' ]');
		}

	};

	self.updateData = function( data_updated, where ){

	};

	/**
	 * Return data from table
	 * @param	where	mixed	Primary key of Array of object to insert, if Object passed it will cast into Array
	 */
	self.select = function( where ){

		var rows = {},
			row = {},
			PK = null;

		if( typeof where === 'undefined' ){
			PK = KUtils.objKeys(self.PK)[0];
			rows = {};
			for( var data_key in self.data ){
				row = self.data[ data_key ];
				rows[ ((is_PK_setted()) ? row[PK] : data_key) ] = row;
			}
			updateStatistics.apply( self, ['select', Object.keys(rows).length ] );
			return rows;
		}

		switch( where.constructor ){
			//	ARRAY, INSIEME DI CHIAVI
			case Array:
				rows = {};
				var len = where.length;
				for( var w=0; w<len; w++ ){
					var _w = where[w];
					rows[ _w ] = self.data[ _w ];
				}
				updateStatistics.apply( self, ['select', Object.keys(rows).length] );
				//	Torno i dati selezionati
				return rows;
				break;

			//	OBJECT, INSIEME DI ATTRIBUTI->VALORI
			case Object:
				PK = KUtils.objKeys(self.PK)[0];
				rows = {};

				for( var data_key in self.data ){
					row = self.data[ data_key ];
					//	Scorro gli attributi da filtrare
					if( __filter( row, where ) ){
						rows[ ((is_PK_setted()) ? data[PK] : data_key) ] = row;
					}
				}

				updateStatistics.apply( this, ['select', Object.keys(rows).length] );
				//	Torno i dati selezionati
				return rows;
		}

		return {};
	};

	/**
	 * Delete all data from table in the database that you are using
	 */
	self.truncate = function(){
		self.data = {};
	};
};


//////////////////////////////////////////////////////
//	KDatabase

JSKDB.prototype.KDatabase = function( db_name, version, struct ){

	var self = this;
	self.db_name = db_name;
	self.version = version;
	self.tables = {};


	self.existsTable = function( table_name ){
		var Database = JSON.parse( localStorage['JSKDB'] );
		return (typeof Database[ self.db_name ]['tables'][ table_name ] !== 'undefined');
	};

	//	Crea una nuova tabella nel DB corrente
	self.createTable = function( table_name, columns, keys ){

		var Database = JSON.parse( localStorage['JSKDB'] );
		var Table = new JSKDB.prototype.KTable( table_name, columns, keys );

		if( self.existsTable(table_name) ){
			JSKDB.prototype.Log.error('table "'+ self.db_name +'.'+ table_name +'" already exists.');
			Table.importData( Database[ self.db_name ]['tables'][ table_name ]['data'] );
		}

		self.tables[ table_name ] = Table;
		return Table;
	};

	/**
	 Insert data into a table
	 @param	table_name	String
	 @param	data		Object|Array
	 */
	self.insertData = function( table_name, data){
		(self.tables[ table_name ]).insertData( data );
	};

	/**
	 Update data into a table
	 @param	table_name		String
	 @param	data_to_update	Object
	 @param	where			Object	Key and value per cercare le righe da modificare
	 */
	//	data_to_update => oggetto (key => data)
	self.updateData = function( table_name, data_to_update, where ){
		(self.tables[ table_name ]).updateData( data_to_update, where );
	};

	//	key
	self.deleteData = function( table_name, key_to_delete ){
		(self.tables[ table_name ]).deleteData( key_to_delete );
	};

	//	Elimina tutti i dati dalla tabella
	self.truncate = function( table_name ){
		(self.tables[ table_name ]).truncate();
	};

	//	Return the first data in the table
	self.select = function( table_name, keys ){
		return (self.tables[ table_name ]).select( keys );
	};

	/**
	 Delete all data from table in the database that you are using
	 @param	table_name		String		The name of table
	 @return	void
	 */
	//	Elimina tutti i dati dalla tabella
	self.truncate = function( table_name ){
		(self.tables[ table_name ]).truncate();
	};

};





/**
 * KUtils
 * @version	2.0.0
 * @author	Kevin Lucich
*/
!function(e){var r=null,t=null,n={text:{all:"^(.)__OF_B__$",alphanumeric:"^[a-zA-Z0-9 ]+$",no_space:"^[\\S]+$",codicefiscale:"^[a-z]{6}[0-9]{2}[a-z][0-9]{2}[a-z][0-9]{3}[a-z]$",piva:"^[0-9]{11}$"},number:{all:"^(([-+]?[0-9]+)|([-+]?([0-9]__OF_B__\\.[0-9]__OF_A__)))$",int:"^[-+]?[0-9]+$",float:"^[-+]?([0-9]__OF_B__\\.[0-9]__OF_A__)$"},ip:{all:"^([1][0-9][0-9]|2[0-4][0-9]|25[0-5]).([1][0-9][0-9]|2[0-4][0-9]|25[0-5]).([1][0-9][0-9]|2[0-4][0-9]|25[0-5]).([1][0-9][0-9]|2[0-4][0-9]|25[0-5])$"},email:{all:"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,6}$"},username:{all:"^([a-zA-Z0-9_-]__OF_B__)$"},password:{all:"^([a-zA-Z0-9_-]__OF_B__)$"},phone:{all:"^([0-9-()+ ]__OF_B__)$"},date:{all:"^(((0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.]([0-9]{4}))|((0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.]([0-9]{4}))|(([0-9]{4})[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))|(([0-9]{4})[- /.](0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])))$","Y-m-d":"^(([0-9]{4})[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))$","Y-d-m":"^(([0-9]{4})[- /.](0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012]))$","m-d-Y":"^((0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.]([0-9]{4}))$","d-m-Y":"^((0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.]([0-9]{4}))$"},space:{all:"[ \t\r\n]",onlyspaces:" ",onlytabs:"\t",onlybreakline:"[\n\r]"},url:{all:"^(https?://)?([da-z.-]+).([a-z.]{2,6})([/w .-]*)*/?$",onlywww:"^w{3}([0-9]+)?.([a-zA-Z0-9]([a-zA-Z0-9-]{0,65}[a-zA-Z0-9])?.)+[a-zA-Z]{2,6}"},creditcard:{all:"^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35d{3})d{11})$",visa:"^4[0-9]{12}(?:[0-9]{3})?$",mastercard:"^5[1-5][0-9]{14}$",americaexpress:"^3[47][0-9]{13}$",dinersclub:"^3(?:0[0-5]|[68][0-9])[0-9]{11}$",discover:"^6(?:011|5[0-9]{2})[0-9]{12}$",jcb:"^(?:2131|1800|35d{3})d{11}$",expdate:"^(0[1-9]|1[012])/([12][0-9])$"},image:{all:"([^s]+(?=.(jpeg|jpg|gif|png|tiff)).)$",jpeg:"([^s]+(?=.(jpeg)).)$",jpg:"([^s]+(?=.(jpg)).)$",gif:"([^s]+(?=.(gif)).)$",png:"([^s]+(?=.(png)).)$",tiff:"([^s]+(?=.(tiff)).)$"},color:{all:"^(rgb((d+),s*(d+),s*(d+)))|(#?([a-f0-9]{6}|[a-f0-9]{3}))$",rgb:"^rgb((d+),s*(d+),s*(d+))$",hex:"^#?([a-fA-Z0-9]{6}|[a-fA-Z0-9]{3})$"},html:{all:"(<(/?[^>]+)>)"}};t={isWindow:function(e){return null!=e&&e===e.window},isPlainObject:function(e){if("object"!=typeof e||e.nodeType||t.isWindow(e))return!1;try{if(e.constructor&&!core_hasOwn.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(e){return!1}return!0}},r={plugins_version:{KUtils:"2.0.0"},version:function(e){if(void 0===e)console.dir(r.plugins_version);else for(p in e)r.plugins_version[p]=e[p]},check:function(e,t,o){var a={check:{init:function(e,t,n){void 0!==e&&"object"!=typeof e&&(e={type:e,subtype:void 0===n?"all":n,value:t});return r.extend(!0,{},{type:"text",subtype:"all",value:!1,rules:{range:"",of:"+",replace:!1}},e)},_do:function(e){var r=function(e,r){return!!/^([*]{1})$|^([0-9]+)$|^([0-9]+,[0-9]+)$/.test(e)||(i("PRM_IGN","$.check",r),!1)},t=n[e.type][e.subtype],o="+",a=e.rules.of;if(""!=e.rules.range)if(a=e.rules.range,"float"==e.subtype){if(/^[0-9]+,[0-9]+;[0-9]+,[0-9]+$/.test(e.rules.range)){var s=e.rules.range.split(";");o=r(s[0],"params.rules.range")?s[0]:"",a=r(s[1],"params.rules.range")?s[1]:"+"}}else a=/^[0-9]+$/.test(a)?"0,"+a:r(a,"params.rules.range")?a:"+";return"+"==a||r(a,"params.rules.of")||(a="+"),"+"!=o&&"*"!=o&&(o="{"+o+"}"),"+"!=a&&"*"!=a&&(a="{"+a+"}"),t=t.replace(/__OF_A__/,o).replace(/__OF_B__/,a),new RegExp(t).test(e.value)}}};return e=a.check.init.apply(void 0,arguments),a.check._do.apply(void 0,[e])},stripslashes:function(e){return(e+"").replace(/\\(.?)/g,function(e,r){switch(r){case"\\":return"\\";case"0":return"\0";case"":return"";default:return r}})},objSize:function(e){return null==e||e.constructor!=Object&&e.constructor!=Array?0:Object.keys(e).length},objClone:function(e){if(null==e||e.constructor!=Object)return e;var r=e.constructor();for(var t in e)t in e&&(r[t]=e[t]);return r},objJoin:function(e,r,t){e=void 0!==e?e:{},r=void 0!==r?r:"=",t=void 0!==t?t:",";var n=[];for(var o in e)e.hasOwnProperty(o)&&n.push(o+r+e[o]);return n.join(t)},obj2Array:function(e){var r=[];for(var t in e)r.push(e[t]);return r},objKeys:function(e){var r=[];if(void 0===e||null==e)return r;switch(e.constructor){case Object:if(void 0!==Object.keys)return Object.keys(e);case Array:for(var t in e)e.hasOwnProperty(t)&&r.push(t);return r;default:return r}},objFlip:function(e){var r=null,t={};for(r in e)e.hasOwnProperty(r)&&(t[e[r]]=r);return t},objIntersectKey:function(){for(var e=[].slice.call(arguments),r=e[0],t=e.length,n=1;n<t;n++){var o=e[n];for(var a in r)void 0===o[a]&&delete r[a]}return r},objKeyAllowed:function(e,t){return e=e||{},t=t||[],r.objIntersectKey(e,r.objFlip(t))},trim:function(e){return null==e||void 0===e||e.constructor!==String?e:void 0!==String.prototype.trim?e.trim():void 0!==String.trim?String.trim(e):e.replace(/^\s+|\s+$/g,"")},inArray:function(e,t){if(void 0===e||t.constructor!==Array)return!1;var n=0,o=null;if(e.constructor===Array){for(o=e.length,n=0;n<o;n++)if(!r.inArray(e[n],t))return!1;return!0}if(void 0!==[].indexOf)return-1!=t.indexOf(e);for(o=t.length,n=0;n<o;n++)if(t[n]==e)return!0;return!1},MD5:function(e){if(null!=e&&(e.constructor==Array||e.constructor==Object)){var t=function(e,n){if(!e)return n;for(h in e)if(0!=e.hasOwnProperty(h)){var o=null==e[h]||e[h].constructor!=Array&&e[h].constructor!=Object?h+":"+e[h]:t(e[h],n);n=r.MD5(n+"_"+o)}return n};e=t(e,"")}var n="0123456789abcdef";function o(r){e="";for(var t=0;t<=3;t++)e+=n.charAt(r>>8*t+4&15)+n.charAt(r>>8*t&15);return e}function a(e,r){var t=(65535&e)+(65535&r);return(e>>16)+(r>>16)+(t>>16)<<16|65535&t}function i(e,r,t,n,o,i){return a((s=a(a(r,e),a(n,i)))<<(u=o)|s>>>32-u,t);var s,u}function s(e,r,t,n,o,a,s){return i(r&t|~r&n,e,r,o,a,s)}function u(e,r,t,n,o,a,s){return i(r&n|t&~n,e,r,o,a,s)}function c(e,r,t,n,o,a,s){return i(r^t^n,e,r,o,a,s)}function l(e,r,t,n,o,a,s){return i(t^(r|~n),e,r,o,a,s)}for(var f=function(e){var r=1+(e.length+8>>6),t=new Array(16*r);for(h=0;h<16*r;h++)t[h]=0;for(h=0;h<e.length;h++)t[h>>2]|=e.charCodeAt(h)<<h%4*8;return t[h>>2]|=128<<h%4*8,t[16*r-2]=8*e.length,t}(e),d=1732584193,p=-271733879,v=-1732584194,y=271733878,g=f.length,h=0;h<g;h+=16)olda=d,oldb=p,oldc=v,oldd=y,p=l(p=l(p=l(p=l(p=c(p=c(p=c(p=c(p=u(p=u(p=u(p=u(p=s(p=s(p=s(p=s(p,v=s(v,y=s(y,d=s(d,p,v,y,f[h],7,-680876936),p,v,f[h+1],12,-389564586),d,p,f[h+2],17,606105819),y,d,f[h+3],22,-1044525330),v=s(v,y=s(y,d=s(d,p,v,y,f[h+4],7,-176418897),p,v,f[h+5],12,1200080426),d,p,f[h+6],17,-1473231341),y,d,f[h+7],22,-45705983),v=s(v,y=s(y,d=s(d,p,v,y,f[h+8],7,1770035416),p,v,f[h+9],12,-1958414417),d,p,f[h+10],17,-42063),y,d,f[h+11],22,-1990404162),v=s(v,y=s(y,d=s(d,p,v,y,f[h+12],7,1804603682),p,v,f[h+13],12,-40341101),d,p,f[h+14],17,-1502002290),y,d,f[h+15],22,1236535329),v=u(v,y=u(y,d=u(d,p,v,y,f[h+1],5,-165796510),p,v,f[h+6],9,-1069501632),d,p,f[h+11],14,643717713),y,d,f[h],20,-373897302),v=u(v,y=u(y,d=u(d,p,v,y,f[h+5],5,-701558691),p,v,f[h+10],9,38016083),d,p,f[h+15],14,-660478335),y,d,f[h+4],20,-405537848),v=u(v,y=u(y,d=u(d,p,v,y,f[h+9],5,568446438),p,v,f[h+14],9,-1019803690),d,p,f[h+3],14,-187363961),y,d,f[h+8],20,1163531501),v=u(v,y=u(y,d=u(d,p,v,y,f[h+13],5,-1444681467),p,v,f[h+2],9,-51403784),d,p,f[h+7],14,1735328473),y,d,f[h+12],20,-1926607734),v=c(v,y=c(y,d=c(d,p,v,y,f[h+5],4,-378558),p,v,f[h+8],11,-2022574463),d,p,f[h+11],16,1839030562),y,d,f[h+14],23,-35309556),v=c(v,y=c(y,d=c(d,p,v,y,f[h+1],4,-1530992060),p,v,f[h+4],11,1272893353),d,p,f[h+7],16,-155497632),y,d,f[h+10],23,-1094730640),v=c(v,y=c(y,d=c(d,p,v,y,f[h+13],4,681279174),p,v,f[h],11,-358537222),d,p,f[h+3],16,-722521979),y,d,f[h+6],23,76029189),v=c(v,y=c(y,d=c(d,p,v,y,f[h+9],4,-640364487),p,v,f[h+12],11,-421815835),d,p,f[h+15],16,530742520),y,d,f[h+2],23,-995338651),v=l(v,y=l(y,d=l(d,p,v,y,f[h],6,-198630844),p,v,f[h+7],10,1126891415),d,p,f[h+14],15,-1416354905),y,d,f[h+5],21,-57434055),v=l(v,y=l(y,d=l(d,p,v,y,f[h+12],6,1700485571),p,v,f[h+3],10,-1894986606),d,p,f[h+10],15,-1051523),y,d,f[h+1],21,-2054922799),v=l(v,y=l(y,d=l(d,p,v,y,f[h+8],6,1873313359),p,v,f[h+15],10,-30611744),d,p,f[h+6],15,-1560198380),y,d,f[h+13],21,1309151649),v=l(v,y=l(y,d=l(d,p,v,y,f[h+4],6,-145523070),p,v,f[h+11],10,-1120210379),d,p,f[h+2],15,718787259),y,d,f[h+9],21,-343485551),d=a(d,olda),p=a(p,oldb),v=a(v,oldc),y=a(y,oldd);return o(d)+o(p)+o(v)+o(y)},hash:function(e){if(!e||e.constructor!=String)return 0;var r,t=0,n=e.length;if(0==n)return t;for(r=0;r<n;r++)t=(t<<5)-t+e.charCodeAt(r),t&=t;return t},empty:function(e){if(null==e)return!0;switch(e.constructor){case Number:return isNaN(e)||0===e;case String:return 0===e.length||"0"===e;case Array:case Object:return 0===r.objSize(e);case Boolean:return!1===e;default:return!1}},rgbToHex:function(e,r,t){var n=function(e){var r=e.toString(16);return 1==r.length?"0"+r:r};return"#"+n(e)+n(r)+n(t)},hexToRgb:function(e,r){void 0===e&&(e="#000000"),void 0===r&&(r=!1);var t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e),n=t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null;return r?n.r+","+n.g+","+n.b:n},extend:"undefined"!=typeof jQuery&&jQuery.extend||function(){var e,t,n,o,a,i,s=function(e){return"object"===jQuery.type(e)&&!e.nodeType&&!jQuery.isWindow(e)&&!(e.constructor&&!hasOwn.call(e.constructor.prototype,"isPrototypeOf"))},u=arguments[0]||{},c=1,l=arguments.length,f=!1;for("boolean"==typeof u&&(f=u,u=arguments[c]||{},c++),"object"==typeof u||jQuery.isFunction(u)||(u={}),c===l&&(u=this,c--);c<l;c++)if(null!=(e=arguments[c]))for(t in e)n=u[t],u!==(o=e[t])&&(f&&o&&(s(o)||(a=Array.isArray(o)))?(a?(a=!1,i=n&&Array.isArray(n)?n:[]):i=n&&s(n)?n:{},u[t]=r.extend(f,i,o)):void 0!==o&&(u[t]=o));return u},range:function(e,r,t){var n=[],o=typeof e,a=typeof r;if(0===t)throw new TypeError("Step cannot be zero.");if("undefined"==o||"undefined"==a)throw new TypeError("Must pass start and end arguments.");if(o!=a)throw new TypeError("Start and end arguments must be of same type.");if(void 0===t&&(t=1),r<e&&(t=-t),"number"==o)for(;t>0?r>=e:r<=e;)n.push(e),e+=t;else{if("string"!=o)throw new TypeError("Only string and number types are supported");if(1!=e.length||1!=r.length)throw new TypeError("Only strings with one character are supported.");for(e=e.charCodeAt(0),r=r.charCodeAt(0);t>0?r>=e:r<=e;)n.push(String.fromCharCode(e)),e+=t}return n},benchmark:function(e,r,t){if(void 0!==e){e.constructor==Object&&(t=e,e=1e3,r=1),r.constructor==Object&&(t=r,r=1);var n={fns:{},statistics:{faster:{fn:null,loop:1/0},slower:{fn:null,loop:-1/0}}};for(fn_name in t){for(var o=t[fn_name],i=[],s=0;s<r;s++){for(var u=(new Date).getTime()+e,c=0;(new Date).getTime()<u;)c++,o();i.push(c)}number_of_execution=function(e){var r=0;for(a in e)r+=e[a];return r/e.length}(i),(null==n.statistics.faster.fn||n.statistics.faster.number_of_execution<number_of_execution)&&(n.statistics.faster={fn:fn_name,number_of_execution:number_of_execution}),(null==n.statistics.slower.fn||n.statistics.slower.number_of_execution>number_of_execution)&&(n.statistics.slower={fn:fn_name,number_of_execution:number_of_execution}),n.fns[fn_name]=number_of_execution}var l=n.statistics.faster.number_of_execution/n.statistics.slower.number_of_execution;return n.statistics.result="The function "+n.statistics.faster.fn+" is faster than "+n.statistics.slower.fn+" of "+(100*l-100).toFixed(2)+"% ("+l.toFixed(2)+" times)",n}console.error("Error: missing fns param")},ucFirst:function(e){return e?e[0].toUpperCase()+e.slice(1):""},dotdotdot:function(e,r){if(void 0===e)return"";void 0===r&&(r=t.length/2);var t=e.split(" ");return t.slice(0,r).join(" ")+"..."},consoleCheck:function(){if(void 0!==e.console)return!0;var r={},t=["log","debug","info","warn","exception","assert","dir","dirxml","trace","group","groupEnd","groupCollapsed","profile","profileEnd","count","clear","time","timeEnd","timeStamp","table","error"];for(f in t)r[t[f]]=function(){};e.console=r},stack:function(e){e=void 0!==e&&e;for(var r=[],t=arguments.callee.caller;null!=t;){var n=/function ([^(]*)/.exec(t+"");n=null!=n&&void 0!==n[1]?n[1]:n,e&&""==n&&(n="anonymous"),""!=n&&r.push(n),t=t.caller}return r.reverse(),r.length?r.join("() -> ")+"()":null},arrayDiff:function(e,r){var t=[],n=[],o=0,a=0;for(a=e.length,o=0;o<a;o++)t[e[o]]=!0;for(a=r.length,o=0;o<a;o++)t[r[o]]?delete t[r[o]]:t[r[o]]=!0;for(var i in t)n.push(i);return n},str_replace:function(e,r,t){var n=r.length,o=0;if(r.constructor===Array&&t.constructor===Array)for(o=0;o<n;o++)e=e.replace(r[o],t[o]);else if(r.constructor===Array)for(o=0;o<n;o++)e=e.replace(r[o],t);else e=e.replace(r,t);return e}};var o={format:function(e){void 0===e&&(e="Y-m-d");for(var r=this,t="",n=e.length,o=0;o<n;o++)switch(e[o]){case"\\":o++;break;case"j":t+=getDate();break;case"d":var a=parseInt(r.getDate());t+=a<10?"0"+a:a;break;case"N":t+=r.getDay();break;case"n":t+=parseInt(r.getMonth())+1;break;case"m":t+=(i=parseInt(r.getMonth())+1)<10?"0"+i:i;break;case"t":var i;t+={1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31}[i=parseInt(r.getMonth())+1];break;case"Y":t+=r.getFullYear();break;case"y":var s=""+(new Date).getFullYear(),u=s.length;t+=s.substring(u-2,u);break;case"g":t+=(c=r.getHours())>12?c-12:c;break;case"G":t+=r.getHours();break;case"h":t+=(c=(c=r.getHours())>12?c-12:c)<10?"0"+c:c;break;case"H":var c;t+=(c=r.getHours())<10?"0"+c:c;break;case"i":var l=r.getMinutes();t+=l<10?"0"+l:l;break;case"s":var f=r.getSeconds();t+=f<10?"0"+f:f;break;case"c":var d=parseInt(r.getMilliseconds()/10);t+=d<10?"0"+d:d;break;case"u":var p=r.getMilliseconds();t+=p<10?"0"+p:p;break;default:t+=e[o]}return t},getMillisecondsByIdentifier:function(e){switch(e){case"d":return 864e5;case"m":return 2592e6;case"y":return 31536e6;case"h":return 36e5;case"i":return 6e4;case"s":return 1e3;case"w":return 6048e5;default:return console.warn('Identifier "'+e+'" undefined! :( '),0}},getDateAfterModify:function(e,r){var t=0,n=r.split(" ");for(m in n){var a=n[m].match(/(\d+)([a-zA-Z])/),i=a[1],s=a[2];t+=o.getMillisecondsByIdentifier(s)*i}var u=this.getTime()+t*e;return new Date(u)},add:function(e){return o.getDateAfterModify.apply(this,[1,e])},sub:function(e){return o.getDateAfterModify.apply(this,[-1,e])}};Date.prototype.format=o.format,Date.prototype.getFormat=function(){return i("DEPRECATED","Date.prototype.getFormat"),Date.prototype.format.apply(this,arguments)},Date.prototype.add=o.add,Date.prototype.sub=o.sub,Object.keys=Object.keys||function(e){var r=[];for(k in e)e.hasOwnProperty(k)&&r.push(k);return r};var i=function(e,t,n){if("undefined"!=typeof console&&void 0!==console.info&&void 0!==console.warn){var o,a={};switch(e){case"PRM_IGN":a.state="Ignored",a.why="Invalid value",a.description=["Will be use the default value"];break;case"IDENT_NOT_DEF":a.state="Ignored",a.why="Invalid value",a.description=["Identifier undefined :( "];break;case"DEPRECATED":a.state="Deprecated Function",a.why="",a.description=["This function is deprected, it will be removed in the future. View the documention for more info."]}switch(o=["Function: "+t,void 0!==n?"Param: "+n:null,"State: "+a.state,"Why: "+a.why,a.description.join("\n\t"),"Stack:\t"+r.stack(),"\n"].filter(function(e){if(void 0!==e&&!r.empty(e))return e}).join("\n\t"),e){case"PRM_IGN":case"IDENT_NOT_DEF":console.warn("KUtils - WARNING"+o)}}};"undefined"!=typeof jQuery&&(r.version({jQuery:jQuery.fn.jquery}),void 0!==jQuery.ui&&r.version({"jQuery.ui":jQuery.ui.version})),e.KUtils=r}(window);

var ChronoMe={chronos:{},Chrono:function(){var t="CHRONO_RUNNING",o="CHRONO_STOP";this.status=t,this.start=(new Date).getTime(),this.end=0,this.stop=function(){return this.status!=t?(console.error("Chrono isn't started"),!1):(this.end=(new Date).getTime(),this.status=o,!0)},this.restart=function(){return this.status=t,this.start=(new Date).getTime(),this.end=0,!0},this.value=function(){return this.status!=o?(console.error("Chrono isn't stopped"),!1):this.end-this.start}},start:function(t){ChronoMe.chronos[t]=new ChronoMe.Chrono},stop:function(t){return ChronoMe.chronos[t].stop(),ChronoMe.value(t)},restart:function(t){ChronoMe.chronos[t].restart()},value:function(t){return ChronoMe.chronos[t].value()},getAllChronos:function(){var t={};for(var o in ChronoMe.chronos)t[o]=ChronoMe.chronos[o].value();return console.dir(t),t}};

