
import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";
import Battery from "embedded:sensor/Battery";

const render=new Poco(screen);

//const font_name="brit";

const f_time=getFont("brit",70);
const f_day=getFont("brit", 22);
const f_date=getFont("seven", 22);
const f_cw=getFont("seven", 15);





// Colors
const c_black=render.makeColor(  0,  0,  0);
const c_white=render.makeColor(255,255,255);
const c_red  =render.makeColor(255,  0,  0);
const c_green=render.makeColor(  0,255,  0);
const c_blue =render.makeColor(  0,  0,255);
const c_work =render.makeColor( 16,  6,159);
const c_free =render.makeColor( 16,  6,159);
const c_sleep=render.makeColor( 16,  6,159);
const c_sneak=render.makeColor( 16,  6,159);

const color_bg=c_white;
const color_fg=c_black;

const DAYS=["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const change="minutechange"
//const change="secondchange"
const battery=new Battery({});


// let batteryPercent=100;
// let isConnected=true;
// let lastDate=new Date();

// function drawFromTime(event){watchface.draw(event,"Time");}
// function drawFromBattery(event){watchface.draw(event,"Bat");}
// function drawFromConnected(event){watchface.draw(event,"Con"
// );}



// watch.addEventListener("connected", drawFromConnected);




class Watchface{
	constructor(){
		this.display=new Rect({x:0,y:0,dx:render.width,dy:render.height});
		// this.counter=0;
		this.lastDate=new Date();
		this.batteryPercent=battery.sample().percent;
	}


	getTexts(){

		const hours=String(this.lastDate.getHours()).padStart(2,"0");
		const minutes=String(this.lastDate.getMinutes()).padStart(2,"0");
		const hm=hours+":"+minutes;

		const date=String(this.lastDate.getDate()).padStart(2,"0")
		const month=String(this.lastDate.getMonth()+1).padStart(2,"0")
		const dm=date+"."+month;

		const cw="KW"+String(weekNumber(this.lastDate)).padStart(2,"0");

		const day=DAYS[this.lastDate.getDay()];

		const bat=this.batteryPercent.toString()+"%";

		this.rect_time   =new Rect().fromText(hm, f_time);
		this.rect_day    =new Rect().fromText(day,f_day);
		this.rect_date   =new Rect().fromText(dm, f_date);
		this.rect_cw     =new Rect().fromText(cw, f_cw);
		this.rect_battery=new Rect().fromText(bat,f_cw);
	}



	draw(event,source){
		try{
			this.draw_internal(event,source)
		}catch(error){
			console.log(error.toString())
		}
	}

	draw_internal(event,source="?"){
		// this.counter++;

		this.batteryPercent=battery.sample().percent;
		// this.isConnected=watch.connected.app;
		// this.batteryPercent=battery.sample().percent;
		// this.lastDate;

		if(event?.date){
		  this.lastDate=event.date;
		}

		this.getTexts();

		render.begin();
		this.display.fillRectangle(color_bg);
		this.rect_time.positionRelativeTo(this.display,CEN,CEN).drawText(color_fg);
		this.rect_day.positionRelativeTo(this.rect_time,CEN,BFE).drawText(color_fg);
		this.rect_date.positionRelativeTo(this.rect_time,CEN,ALE).drawText(color_fg);
		this.rect_cw.positionRelativeTo(this.rect_date,ALE,CEN).offset(10,0).drawText(color_fg);
		this.rect_battery.positionRelativeTo(this.display,BLE,AFE).offset(-12,7).drawText(color_fg);
		   
		new Rect({dy:15,dx:this.display.dx*(this.batteryPercent/100)}).positionRelativeTo(this.display,AFE,BLE).fillRectangle(color_fg);
		
		if(watch.connected?.app){
		   new Rect({dx:15,dy:15}).positionRelativeTo(this.display,AFE,AFE).offset(10,10).fillRectangle(color_fg);
		}
		
		render.end();
	}
}


// function drawConnectedState(){
//     if(isConnected){
//         render.fillRectangle(color_fg,3,3,10,10);
//     }
// }


function weekNumber(date){
	let dateCopy=new Date(date.getTime())
	var dayNum=dateCopy.getUTCDay() || 7;
	dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
	var yearStart=new Date(Date.UTC(dateCopy.getUTCFullYear(),0,1));
	return Math.ceil((((dateCopy - yearStart) / 86400000) + 1)/7)
}


const BFE=0;// bfe: before first edge
const AFE=1;// afe: after first edge
const CEN=2;// cen: center
const BLE=3;// ble: before last edge
const ALE=4;// ale: after last edge

class Rect{
	constructor(obj={}){
		this.x =obj?.x??0;
		this.y =obj?.y??0;
		this.dx=obj?.dx??0;
		this.dy=obj?.dy??0;
	}

	fromText(str,font){
		this.text=str
		this.font=font
		this.dy=font.height
		this.dx=render.getTextWidth(this.text,this.font);
		return this;
	}

	offset(dx,dy){
		this.x+=dx;
		this.y+=dy;
		return this;
	}

	drawText(color){
		render.drawText(this.text,this.font,color,this.x,this.y);
		return this;
	}

	fillRectangle(color){
		render.fillRectangle(color,this.x,this.y,this.dx,this.dy);
		return this;
	}

	positionRelativeTo(rect,relx,rely){
		switch(relx){
			case BFE:this.x=rect.x-this.dx;break;
			case AFE:this.x=rect.x;break;
			case CEN:this.x=rect.x+(rect.dx/2)-(this.dx/2);break;
			case BLE:this.x=rect.x+rect.dx-this.dx;break;
			case ALE:this.x=rect.x+rect.dx;break;
		}
		switch(rely){
			case BFE:this.y=rect.y-this.dy;break;
			case AFE:this.y=rect.y;break;
			case CEN:this.y=rect.y+(rect.dy/2)-(this.dy/2);break;
			case BLE:this.y=rect.y+rect.dy-this.dy;break;
			case ALE:this.y=rect.y+rect.dy;break;
		}
	return this;
	}
}

function getFont(name, size) {
    const font = parseBMF(
        new Resource(name+"-"+size.toString()+".fnt")
    );

    font.bitmap = parseRLE(
		new Resource(name+"-"+size.toString()+"-alpha.bm4")
    );

    return font;
}

const watchface = new Watchface();

function drawFromTime(event){
	watchface.draw(event,"Time");
}

function drawFromConnection() {

	watchface.draw(null,"Connection");
}

watch.addEventListener("connected",drawFromConnection);
watch.addEventListener(change, drawFromTime);


