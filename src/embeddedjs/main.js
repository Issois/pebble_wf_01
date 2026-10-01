
import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Resource from "Resource";
import Battery from "embedded:sensor/Battery";

// var Pebble = require('ui');
const render=new Poco(screen);

const f_time=getFont("brit",70);
const f_day=getFont("brit", 30);
const f_date=getFont("seven", 30);
const f_cw=getFont("seven", 23);

// Colors
const c_black=render.makeColor(  0,  0,  0);
const c_white=render.makeColor(255,255,255);
const color_bg=c_white;
const color_fg=c_black;
const COLORS=[
	color_bg,
	render.makeColor(255,  0,  0),
	render.makeColor(  0,255,  0),
	render.makeColor(  0,255,255),
	render.makeColor(255,170,  0),
];

const DIRES=[
	{x: 0,y:-1},
	{x: 1,y: 0},
	{x: 0,y: 1},
	{x:-1,y: 0}
]


const MINUTES_PER_DAY=24*60;


const DAYS=["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
// const DAYS=[7,1,2,3,4,5,6];

const change="minutechange"
// const change="secondchange"
const battery=new Battery({});

// const PX_COUNT=4;
// const PX_RESOLUTION=15;
const RESOLUTION={x:15,y:19}


class Watchface{
	constructor(){
		this.display=new Rect({x:0,y:0,dx:render.width,dy:render.height});
		this.gridSize={nx:Math.ceil(this.display.dx/RESOLUTION.x),ny:Math.ceil(this.display.dy/RESOLUTION.y)};
		console.log(`disp: ${this.display.dx}x${this.display.dy}, Res=${RESOLUTION.x}x${RESOLUTION.y}, grid:${this.gridSize.nx}x${this.gridSize.ny}`);
		this.lastDate=new Date();
		this.batteryPercent=battery.sample().percent;
		this.initRects();
		// this.counter=0;
		this.position=new Array(COLORS.length);
		this.direction=new Array(COLORS.length);
		this.grid=new Array(this.gridSize.nx);
		for(let gx=0;gx<this.grid.length;gx++){
			this.grid[gx]=new Array(this.gridSize.ny);
			for(let gy=0;gy<this.grid[gx].length;gy++){
				this.grid[gx][gy]=0;
			}
		}
		for(let i=1;i<this.position.length;i++){
			let pos={x:getRandomInt(0,this.gridSize.nx),y:getRandomInt(0,this.gridSize.nx)};
			this.position[i]=pos;
			this.direction[i]=getRandomInt(0,DIRES.length);
			this.grid[pos.x][pos.y]=i;
		}


	}

	initRects(){
		this.rect_time=new Rect().fromText(this.timeString(),f_time).positionRelativeTo(this.display,CEN,CEN);
		this.rect_date   =new Rect().fromText(this.dateString(), f_date).positionRelativeTo(this.rect_time,CEN,ALE).offset(-30,0);
		this.rect_cw     =new Rect().fromText(this.cwString(), f_cw).positionRelativeTo(this.rect_date,ALE,CEN).offset(20,0);
		this.rect_day={}

		for(let i=0;i<DAYS.length;i++){
			this.rect_day[i]=new Rect().fromText(DAYS[i],f_day).positionRelativeTo(this.rect_time,CEN,BFE);
		}

		this.rect_battery=new Rect().fromText("__%",f_cw).positionRelativeTo(this.display,BLE,AFE).offset(-12,7);
		this.rectBtOff=new Rect({dx:17,dy:17}).positionRelativeTo(this.display,AFE,AFE).offset(10,10);
		this.rectBtOn=new Rect({dx:15,dy:15}).positionRelativeTo(this.rectBtOff,CEN,CEN);

	}

	renderTexts(){
		this.rect_time .drawText(color_fg ,this.timeString(),color_bg);
		this.rect_date .drawText(color_fg ,this.dateString(),color_bg);
		this.rect_cw   .drawText(color_fg ,this.cwString(),color_bg);
		const day=this.lastDate.getDay();
		this.rect_day[day].drawText(color_fg,DAYS[day],color_bg);
		this.rect_battery   .drawText(color_fg ,this.batString(),color_bg);
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
		if(event?.date){this.lastDate=event.date;}
		// this.lastDate=new Date(this.lastDate.getTime()+(this.counter*60*1000));

		// update grid
		// console.log("p: "+this.direction.toString())
		if(source=="Time"){
			for(let pos=1;pos<this.position.length;pos++){
				// console.log("p: "+pos.toString())
				let direChange=getRandomInt(-1,2);
				this.direction[pos]=mod(this.direction[pos]+direChange,DIRES.length);
				this.position[pos].x=mod(this.position[pos].x+DIRES[this.direction[pos]].x,this.gridSize.nx);
				this.position[pos].y=mod(this.position[pos].y+DIRES[this.direction[pos]].y,this.gridSize.ny);
				// console.log(pos.toString()+" "+this.position[pos].x.toString()+" "+this.position[pos].y.toString())
				this.grid[this.position[pos].x][this.position[pos].y]=pos;
			}
		}

		render.begin();

		for(let gx=0;gx<this.gridSize.nx;gx++){
			for(let gy=0;gy<this.gridSize.ny;gy++){
				render.fillRectangle(COLORS[this.grid[gx][gy]],gx*RESOLUTION.x,gy*RESOLUTION.y,RESOLUTION.x,RESOLUTION.y);
			}
		}

  		this.renderTexts()

		this.rectBtOff.fillRectangle(color_bg);
		if(watch.connected?.app){
			this.rectBtOn.fillRectangle(color_fg);
		}

		render.end();
	}

	getDayCompleted(){
		const result=(this.lastDate.getMinutes()+(60*this.lastDate.getHours()))*1.0/MINUTES_PER_DAY;
		// console.log("day.completed: "+result.toString());
		return result

	}
	dateString(){return String(this.lastDate.getDate()).padStart(2,"0")+"."+String(this.lastDate.getMonth()+1).padStart(2,"0");}
	timeString(){return String(this.lastDate.getHours()).padStart(2,"0")+":"+String(this.lastDate.getMinutes()).padStart(2,"0");}
	cwString(){return "KW"+String(weekNumber(this.lastDate)).padStart(2,"0");}
	batString(){return this.batteryPercent.toString()+"%";}


}

function mod(n,d){
	return ((n % d) + d) % d;
}

// function rand(a,b){
// 	return (Math.random()*(b-a))+a;
// }

function getRandomInt(min,max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

// function hsv64(t) {
//     t = ((t % 1) + 1) % 1;

//     // Continuous HSV → RGB
//     const h = t * 6;
//     const i = Math.floor(h);
//     const f = h - i;
//     const q = 1 - f;

//     let r, g, b;

//     switch (i) {
//         case 0: r = 1; g = f; b = 0; break;
//         case 1: r = q; g = 1; b = 0; break;
//         case 2: r = 0; g = 1; b = f; break;
//         case 3: r = 0; g = q; b = 1; break;
//         case 4: r = f; g = 0; b = 1; break;
//         default: r = 1; g = 0; b = q; break;
//     }

//     // Quantize to Pebble's 4 levels per channel
//     r = Math.round(r * 3) * 85;
//     g = Math.round(g * 3) * 85;
//     b = Math.round(b * 3) * 85;

//     return [r, g, b];
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

	drawText(color,text=null,colorOutline=null,outlineThickness=2){
		if(text!=null){
			this.text=text;
		}
		if(colorOutline!=null){
			for(let offs=1;offs<=outlineThickness;offs++){
				render.drawText(this.text,this.font,colorOutline,this.x+offs,this.y);
				render.drawText(this.text,this.font,colorOutline,this.x-offs,this.y);
				render.drawText(this.text,this.font,colorOutline,this.x,this.y+offs);
				render.drawText(this.text,this.font,colorOutline,this.x,this.y-offs);
				// render.drawText(this.text,this.font,colorOutline,this.x+offs,this.y+offs);
				// render.drawText(this.text,this.font,colorOutline,this.x-offs,this.y+offs);
				// render.drawText(this.text,this.font,colorOutline,this.x+offs,this.y-offs);
				// render.drawText(this.text,this.font,colorOutline,this.x-offs,this.y-offs);
			}
		}
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


