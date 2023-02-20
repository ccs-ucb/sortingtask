var imgs = ["acorn.jpg", "axe.jpg", "barbecue.jpg", "beach.jpg", "berries.jpg", "bike.jpg", "books.jpg", "bowling.jpg", "bread.jpg", "bridge.jpg", "butterfly.jpg", "cables.jpg", "camera.jpg", "candle.jpg", "cards.jpg", "castle.jpg", "cat.jpg", "chess.jpg", "cliffs.jpg", "clock.jpg", "coffee.jpg", "compass.jpg", "couch.jpg", "cupcake.jpg", "diamond.jpg", "dice.jpg", "dog.jpg", "ducklings.jpg", "eiffel.jpg", "envelope.jpg", "faucet.jpg", "field.jpg", "fire.jpg", "fireworks.jpg", "fish.jpg", "flowers.jpg", "forest.jpg", "fox.jpg", "goat.jpg", "guitar.jpg", "hammer.jpg", "headphones.jpg", "helicopter.jpg", "honey.jpg", "house.jpg", "icetea.jpg", "keys.jpg", "ladybug.jpg", "lamp.jpg", "laptop.jpg", "lighthouse.jpg", "money.jpg", "moon.jpg", "mountain.jpg", "oil.jpg", "paintbrush.jpg", "parachute.jpg", "parrot.jpg", "pen.jpg", "perfume.jpg", "piano.jpg", "pinecone.jpg", "plane.jpg", "puffin.jpg", "racecar.jpg", "road.jpg", "roadsign.jpg", "rooster.jpg", "salad.jpg", "scissors.jpg", "screws.jpg", "sculpture.jpg", "shaving.jpg", "ship.jpg", "skiing.jpg", "soccerball.jpg", "spaceshuttle.jpg", "spices.jpg", "sprouts.jpg", "stairs.jpg", "stapler.jpg", "starfish.jpg", "statue.jpg", "swan.jpg", "table.jpg", "taxi.jpg", "teddybear.jpg", "tomatoes.jpg", "toothpaste.jpg", "towels.jpg", "tulips.jpg", "turtle.jpg", "typewriter.jpg", "watch.jpg", "waterfall.jpg", "zebras.jpg"]

var image_array			  
var num_main_trials, num_practice_trials
var instructions_text
var instructions_urls
var instructions_text_after_practice
var instructions_urls_after_practice	
var instructions_text_after_advice
var instructions_urls_after_advice
var instructions_text_before_demonstration
var instructions_urls_before_demonstration
var instructions_text_pass_quiz
var instructions_urls_pass_quiz
var instructions_text_fail_quiz
var instructions_urls_fail_quiz
var num_imgs
var selected_color = "#FF7909"
var unselected_color = "#000000"
var suggest_color = "#0000ff"
var guiding_color = "#19DD89"
var data_log = []
var selected, num_swaps, inherited_advice
var receive_advice_text
var enter_advice_text
var show_practice_scores_text
var show_main_scores_text
var select_advice_text
var score_text = []
var advice_mode
var selection_mode
var bonus
var quiz_content
var max_selections
var has_seen_guiding_instructions = false
var informed_selection

function shuffle(array){
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex){
	randomIndex = Math.floor(Math.random() * currentIndex);
	currentIndex -= 1;
	temporaryValue = array[currentIndex];
	array[currentIndex] = array[randomIndex];
	array[randomIndex] = temporaryValue;
  }
  return array;
}

function remove_same_img_clicks(arr){
	if (Array.isArray(arr)){
		return arr.filter(function(swap){
			return swap["indices"][0]!=swap["indices"][1]
		})
	}
	return arr
}

function swap_ranks(i,j){
	[rank[i],rank[j]]=[rank[j],rank[i]]
}

function swap_imgs(img1,img2){
	var temp_left = img1.css("left")
	var temp_id = img1.attr("id")
	img1.css("left",img2.css("left"))
	img1.attr("id",img2.attr("id"))
	img2.css("left",temp_left)
	img2.attr("id",temp_id)
}

function on_img_hover(img,mode){
	log_data({"event_type": "hover", "event_info": {"index" : img.attr('id'), "mode" : mode}})
	if (mode == "on"){
		img.find(".transbox").css({"opacity" : 0.1})
	}
	else {
		img.find(".transbox").css({"opacity" : 0})
	}
}


function try_swap(img){
	selected.css("border-color" , unselected_color)
	img.css("border-color" , unselected_color)
	var i_selected = parseInt(selected.attr("id"))
	var i_img = parseInt(img.attr("id"))
	if((rank[i_img] > rank[i_selected]) != (i_img > i_selected)){
		swap_imgs(img,selected)
		swap_ranks(i_img, i_selected)
		log_data({"event_type": "swap", "event_info": {"indices" : [i_selected, i_img], "success": true}})
	}
	else {
		log_data({"event_type": "swap", "event_info": {"indices" : [i_selected, i_img], "success": false}})
	}
	if(i_img != i_selected){
		num_swaps++;
	}
	selected = undefined
	$('.task_img').mousedown(function(){
		on_img_mousedown($(this));
	}).mouseup(function(){
		on_img_mouseup($(this));
	})
}

function on_img_mousedown(img){
	log_data({"event_type": "mousedown", "event_info": {"index" : img.attr('id')}})
	img.css("border-color" , selected_color)
}

function on_img_mouseup(img){
	log_data({"event_type": "mouseup", "event_info": {"index" : img.attr('id')}})
	if(selected === undefined){
		selected = img
	}
	else if (selected === img){
		selected = undefined
		img.css("border-color" , unselected_color)
	}
	else{
		$('.task_img').off("mousedown").off("mouseup")
		setTimeout(function(){
			try_swap(img)
		},150)
	}
}

function create_imgs(){
	log_data({"event_type": "create images", "event_info" : {"img_urls" : task_imgs.slice()}})
	for(i = 0; i < num_imgs; i++){
		left = 100*(i+0.5)/num_imgs-6
		$("<div />", {
			class: "task_img",
			id: i.toString(),
		}).mousedown(function(){
			on_img_mousedown($(this));
		}).mouseup(function(){
			on_img_mouseup($(this));	
		}).hover(function(){
			on_img_hover($(this),"on");
		},function(){
			on_img_hover($(this),"off");
		}).css({
			"background-image" : "url('" + get_image_path(task_imgs[i]) + "')",
			"left" : left.toString() + "vw",
			"top" : "30vh"
		}).append("<div class = 'transbox'></div><p></p>").appendTo("#listsortingpane").show();
	}
}

function show_image_numbers(opacity){
	for(i = 0; i < num_imgs; i++){
		$(".task_img#" + i.toString() + " .transbox").off("mouseenter").off("mouseleave").css("opacity",opacity)
		$(".task_img#" + i.toString() + " p").text(rank[i].toString())
	}
}

function is_sorted(arr){
	for(i = 0; i < num_imgs-1; i++){
		if(rank[i+1]<rank[i]){
			return false;
		}
	}
	return true;
}

function check_finished(trial_num){
	var sorted = is_sorted(rank)
	show_image_numbers(0.5);
	$("#finishedbutton").hide().off("click")
	var feedbacktext = (sorted ? "Correct" : "Incorrect") + ", " + num_swaps.toString() + " comparison" + (num_swaps!=1? "s":"")
	var trial_bonus = (sorted?1.25*(0.8*Math.min(10/Math.max(num_swaps,1),1)**2+0.2):0)
	bonus = bonus + trial_bonus/(num_main_trials+1)
	if(trial_num<num_practice_trials){
		score_text.push("Trial " + (trial_num + 1) + ": " + feedbacktext)
		$("#feedback p").text(feedbacktext)
	}
	else {
		score_text.push("Trial " + (trial_num - num_practice_trials +1) + ": "  + feedbacktext)
		$("#feedback p").text(feedbacktext + ", Bonus so far: $" + bonus.toFixed(2))
	}
	log_data({"event_type": "finished", "event_info": {"correct": sorted, "num_swaps": num_swaps, "is_practice" : trial_num < num_practice_trials, "trial_num" : trial_num, "bonus" : bonus, "trial_bonus" : trial_bonus}})
	$("#feedback").show()
	$(".task_img").off("mousedown").off("mouseup").off("mouseenter").off("mouseleave")
	$("#nexttrialbutton").show()
}

function do_trial(trial_num){
	log_data({"event_type": "do trial", "event_info" : {"trial_num" : trial_num}})
	num_swaps = 0
	selected = undefined
	if(trial_num<num_practice_trials){
		task_imgs = shuffled_imgs.slice(trial_num*num_imgs,(trial_num+1)*num_imgs);		
	}
	else{
		task_imgs = shuffled_imgs.slice((trial_num+max_selections)*num_imgs,(trial_num+max_selections+1)*num_imgs);	
	}
	rank = []
	for(i =0; i<num_imgs; i++){
		rank.push(i+1);
	}
	rank = shuffle(rank)
	log_data({"event_type": "shuffle", "event_info" : {"rank" : rank.slice(), "img_urls" : task_imgs, "trial_num" : trial_num}})
	create_imgs()
	$("#finishedbutton").css({"border-color" : "#666666"}).show().off("click").on("click",function(){
		check_finished(trial_num)
	});
	$("#nexttrialbutton").on("click",function(){
		log_data({"event_type": "click next trial", "event_info" : {"trial_num" : trial_num}})
		$('.task_img').remove()
		$("#nexttrialbutton").off("click").hide()			
		$("#feedback").hide()
		if(trial_num == num_practice_trials -1){
			show_scores(true)
		}
		else if(trial_num == num_practice_trials + num_main_trials -1){
			show_scores(false)
		}
		else if(trial_num == num_practice_trials + num_main_trials){
			finish_experiment()
		}
		else{
			do_trial(trial_num+1)
		}
	})
}

function show_scores(is_practice){
	log_data({"event_type": "show scores", "event_info" : {"score_text" : score_text, "is_practice" : is_practice}})
	$('.overlayed').show();
	$('#score').show()
	$('#score p').text(is_practice?show_practice_scores_text:show_main_scores_text)
	for(i =0;i<score_text.length;i++){
		$("#score button").before("<p>" + score_text[i] + "</p>")
	}
	if(is_practice){
		$('#score h4').text("Practice")
	}
	else{
		$('#score h4').text("Bonus")		
	}
	$("#score button").off("click").on("click",function(){
		log_data({"event_type": "click next scores", "event_info" : {}})
		$('#score').hide();
		$('#score p').remove();
		$("#score button").before("<p></p>")
		if(is_practice){
			score_text = []
			show_instructions(0,instructions_text_after_practice,instructions_urls_after_practice,select_and_show_advice,"Next","Learning")	
		}
		else{
			show_instructions(0,instructions_text_after_main,instructions_urls_after_main,enter_advice,"Next","Demonstration")	
		}
	})
}

function select_and_show_advice(){
	if(selection_mode == "no-selection" || inherited_advice.length==1){
		task_imgs = shuffled_imgs.slice(num_practice_trials*num_imgs,(num_practice_trials+1)*num_imgs);
		show_advice(inherited_advice[0],{})
	}
	else {
		select_advice({})
	}
}

function select_advice(previously_selected){
	log_data({"event_type": "select advice", "event_info" : {"inherited_advice" : inherited_advice, "previously_selected" : previously_selected}})
	$('.overlayed').show();
	$('#select_advice').show()
	$('#select_advice p:not(:first)').remove()
	if(Object.keys(previously_selected).length==0){
		$('#select_advice p').text(select_advice_text_initial)
		$('#select_advice button').hide()
	}
	else{
		$('#select_advice p').text(select_advice_text_additional)
		$('#select_advice button').show().off('click').on('click',function(){
			log_data({"event_type": "click next select", "event_info" : {}})
			$('#select_advice').hide()
			show_instructions(0,instructions_text_after_advice,instructions_urls_after_advice,start_main,"Continue","Bonus")
		})
	}
	for(i=0;i<inherited_advice.length;i++){
		$('#select_advice').append("<p></p>")
		$("<span />", {
			class: "inherited_advice"
		}).text(parent_strings[i]).prepend(
			"<i class='fas fa-user'></i>"
		).off("click").on("click",function (i) {
			return function(){
				log_data({"event_type": "select parent", "event_info" : {"parent" : i, "parent_id" : inherited_advice[i]["parent_id"], "parent_string" : parent_strings[i], "selected_advice": inherited_advice[i], "previously_selected" : previously_selected}})
				$('#select_advice').hide()
				if(i in previously_selected){
					task_imgs = previously_selected[i]
				}
				else{
					n = num_practice_trials+Object.keys(previously_selected).length
					task_imgs = shuffled_imgs.slice(n*num_imgs,(n+1)*num_imgs);
					previously_selected[i]=task_imgs.slice()
				}
				show_advice(inherited_advice[i],previously_selected)
			}
		}(i)
		).appendTo("#select_advice p:last")
	}
}

function after_advice(previously_selected){
	if(inherited_advice.length==1 || selection_mode == "single-selection" || selection_mode == "no-selection" || Object.keys(previously_selected).length == max_selections){
		show_instructions(0,instructions_text_after_advice,instructions_urls_after_advice,start_main,"Continue","Bonus")
	}
	else{
		select_advice(previously_selected)
	}
}

function show_advice(advice,previously_selected){
	log_data({"event_type": "show advice", "event_info" : {"advice" : advice}})
	if(advice_mode == "text" || advice["replay_data"]["sequence"] == undefined){
		show_advice_text(advice["advice_text"],function(){
			after_advice(previously_selected)
		})
	}
	else if(advice_mode == "replay"){
		show_replay(advice["replay_data"],function(){
			after_advice(previously_selected)
		})
	}
	else if(advice_mode == "both"){
		show_advice_text(advice["advice_text"],function(){
			show_replay(advice["replay_data"],function(){
				after_advice(previously_selected)
			})
		})
	}
}

function show_advice_text(advice_text,callback){
	log_data({"event_type": "show advice text", "event_info" : {"advice_text" : advice_text}})
	$('.overlayed').show();
	$('#advice').show()
	$('#advice p').text(receive_advice_text)
	$('#advice textarea').text(advice_text).prop('disabled', true);
	$('#advice h4').text('Learning')
	$("#advice button").off("click").on("click",function(){
		log_data({"event_type": "click next advice text", "event_info" : {}})
		$('#advice').hide();
		callback()
	})
}

function do_replay_guided(sequence,i,callback){
	if(i==sequence.length){
		log_data({"event_type": "do replay guided", "event_info" : {"swap_number" : i}})
		$("#finishedbutton").show().css({"border-color" : guiding_color}).off("click").on("click",function(){
			log_data({"event_type": "click finished guided", "event_info" : {}})
			$("#finishedbutton").off("click").hide().css({"border-color" : "black"})
			var sorted = is_sorted(rank)
			var num_swaps = sequence.length
			show_image_numbers(0.5);
			var feedbacktext = (sorted ? "Correct" : "Incorrect") + ", " + num_swaps.toString() + " comparison" + (num_swaps!=1? "s":"")
			$("#feedback p").text(feedbacktext)
			$("#feedback").show()
			setTimeout(function(){
				$("#replayendbutton").show().off("click").on("click",function(){
					log_data({"event_type": "click end guided", "event_info" : {}})
					$("#replayendbutton").hide().off("click")
					$(".task_img").remove()
					$("#feedback").hide()
					callback()
				})
			},800)
		})
	}
	else{
		log_data({"event_type": "do replay guided", "event_info" : {"swap_number" : i, "swap" : sequence[i]}})
		$(".task_img").hover(function(){
			on_img_hover($(this),"on",false);
		},function(){
			on_img_hover($(this),"off",false);
		}).mousedown(function(){
			$(this).css("border-color" , selected_color)
		}).mouseup(function(){
			if($(this).attr('id')==sequence[i]["indices"][0]){
				log_data({"event_type": "click image guided", "event_info" : {"id" : $(this).attr('id'), "in_sequence" : true}})
				$(this).css("border-color" , selected_color)
				$(".task_img").off("mousedown mouseup mouseenter mouseleave")
				$(".task_img:not(#" + sequence[i]["indices"][0].toString() + ")").css(
					{"border-color" : unselected_color, "opacity" : 1}
				).hover(function(){
					on_img_hover($(this),"on",false);
				},function(){
					on_img_hover($(this),"off",false);
				}).mousedown(function(){
					$(this).css("border-color" , selected_color)
				}).mouseup(function(){
					if($(this).attr('id')==sequence[i]["indices"][1]){
						log_data({"event_type": "click image guided", "event_info" : {"id" : $(this).attr('id'), "in_sequence" : true}})
						$(".task_img").off("mousedown mouseup mouseenter mouseleave")
						setTimeout(function(){
							$(".task_img").css({"border-color" : unselected_color, "opacity" : 1})
							if(sequence[i]["success"]){
								swap_imgs($(".task_img#" + sequence[i]["indices"][0]),$(".task_img#" + sequence[i]["indices"][1]))
								swap_ranks(sequence[i]["indices"][0],sequence[i]["indices"][1])
							}
							setTimeout(function(){
								do_replay_guided(sequence,i+1,callback)
							},350)
						},150)	
					}
					else{
						log_data({"event_type": "click image guided", "event_info" : {"id" : $(this).attr('id'), "in_sequence" : false}})
						$(".task_img:not(#" + sequence[i]["indices"][0].toString() + ",#" + sequence[i]["indices"][1].toString() + ")").css(
							{"border-color" : unselected_color, "opacity" : 0.7}
						).off("mousedown mouseup mouseenter mouseleave")
						$(".task_img#" + sequence[i]["indices"][1].toString()).css("border-color" , guiding_color)
					}
				})
			}
			else{
				log_data({"event_type": "click image guided", "event_info" : {"id" : $(this).attr('id'), "in_sequence" : false}})
				$(".task_img").not("#" + sequence[i]["indices"][0].toString()).css(
					{"border-color" : unselected_color, "opacity" : 0.7}
				).off("mousedown mouseup mouseenter mouseleave")
				$(".task_img#" + sequence[i]["indices"][0].toString()).css("border-color" , guiding_color)
			}
		})
	}
}

function do_replay_forced(sequence,i,callback){
	if(i==sequence.length){
		log_data({"event_type": "do replay forced", "event_info" : {"swap_number" : i}})
		$("#finishedbutton").show().css({"border-color" : guiding_color}).off("click").on("click",function(){
			log_data({"event_type": "click finished forced", "event_info" : {}})
			$("#finishedbutton").off("click").hide().css({"border-color" : "black"})
			var sorted = is_sorted(rank)
			var num_swaps = sequence.length
			show_image_numbers(0.5);
			var feedbacktext = (sorted ? "Correct" : "Incorrect") + ", " + num_swaps.toString() + " comparison" + (num_swaps!=1? "s":"")
			$("#feedback p").text(feedbacktext)
			$("#feedback").show()
			setTimeout(function(){
				$("#replayendbutton").show().off("click").on("click",function(){
					log_data({"event_type": "click next forced", "event_info" : {}})
					$("#replayendbutton").hide().off("click")
					$(".task_img").remove()
					$("#feedback").hide()
					callback()
				})
			},800)
		})
	}
	else{
		log_data({"event_type": "do replay forced", "event_info" : {"swap_number" : i, "swap" : sequence[i]}})
		$(".task_img#" + sequence[i]["indices"][0].toString()).css("border-color" , guiding_color).hover(function(){
			on_img_hover($(this),"on",false);
		},function(){
			on_img_hover($(this),"off",false);
		}).mousedown(function(){
			$(this).css("border-color" , selected_color)
		}).mouseup(function(){
			log_data({"event_type": "click image forced", "event_info" : {"id" : $(this).attr('id')}})
			$(this).off("mousedown mouseup mouseenter mouseleave")
			$(this).css("border-color" , selected_color)
			$(".task_img#" + sequence[i]["indices"][1].toString()).css("border-color" , guiding_color).hover(function(){
				on_img_hover($(this),"on",false);
			},function(){
				on_img_hover($(this),"off",false);
			}).mousedown(function(){
				$(this).css("border-color" , selected_color)
			}).mouseup(function(){
				log_data({"event_type": "click image forced", "event_info" : {"id" : $(this).attr('id')}})
				$(this).off("mousedown mouseup mouseenter mouseleave")
				setTimeout(function(){
					$(".task_img").css("border-color", unselected_color)
					if(sequence[i]["success"]){
						swap_imgs($(".task_img#" + sequence[i]["indices"][0]),$(".task_img#" + sequence[i]["indices"][1]))
						swap_ranks(sequence[i]["indices"][0],sequence[i]["indices"][1])
					}
					setTimeout(function(){
						do_replay_forced(sequence,i+1,callback)
					},350)
				},150)
			})
		})
	}
}


function show_replay_forced(replay_data,callback){
	log_data({"event_type": "show replay forced", "event_info" : {"replay_data" : replay_data}})
	$(".overlayed").hide()
	create_imgs()
	rank = replay_data["rank"].slice()
	$(".task_img").off("mousedown mouseup mouseenter mouseleave")
	do_replay_forced(replay_data["sequence"],0,callback)
}

function show_replay_guided(replay_data,callback){
	log_data({"event_type": "show replay guided", "event_info" : {"replay_data" : replay_data}})
	$(".overlayed").hide()
	create_imgs()
	rank = replay_data["rank"].slice()
	$(".task_img").off("mousedown mouseup mouseenter mouseleave")
	do_replay_guided(replay_data["sequence"],0,callback)
}

function show_replay(replay_data,callback){
	log_data({"event_type": "show replay", "event_info" : {"replay_data" : replay_data, "has_seen_guiding_instructions" : has_seen_guiding_instructions}})
	if(has_seen_guiding_instructions){
		show_replay_forced(replay_data,function(){
			show_replay_guided(replay_data,callback)
		})
	}
	else{
		show_instructions(0,instructions_text_before_guiding,instructions_urls_before_guiding,function(){
			has_seen_guiding_instructions = true
			show_replay_forced(replay_data,function(){
				show_instructions(0,instructions_text_during_guiding,instructions_urls_during_guiding,function(){
					show_replay_guided(replay_data,callback)
				},"Next","Learning")
			})
		},"Next","Learning")
	}
}

function enter_advice(){
	log_data({"event_type": "enter advice", "event_info" : {}})
	$('.overlayed').show();
	$('#advice').show()
	$('#advice p').text(enter_advice_text)
	$('#advice textarea').text("").prop('disabled', false);
	$('#advice h4').text('Demonstration')
	$("#advice button").hide().text("Submit").off("click").on("click",function(){
		log_data({"event_type": "submit advice", "event_info" : {"advice" : $('#advice textarea').val()}})
		$('#advice').hide();
		show_instructions(0,instructions_text_before_demonstration,instructions_urls_before_demonstration,do_demonstration,"Continue","Demonstration")
	})
	$("#advice textarea").off("keyup").on("keyup",function(){
		if($("#advice textarea").val().length>=1){
			$("#advice button").show()
		}
		else{
			$("#advice button").hide()
		}
	})
}

function do_demonstration(){
	log_data({"event_type": "demonstration trial", "event_info" : {}})
	$("#nexttrialbutton").text("Finished")
	do_trial(num_practice_trials + num_main_trials)
}

function start_main(){
	log_data({"event_type": "start main", "event_info" : {}})
	bonus = 0
	do_trial(num_practice_trials)
}

function start_practice(){
	log_data({"event_type": "start practice", "event_info" : {}})
	do_trial(0)
}

function pass_quiz(num_previous_tries){
	log_data({"event_type": "pass quiz", "event_info" : {"number_of_previous_tries" : num_previous_tries}})
	show_instructions(0,instructions_text_pass_quiz,instructions_urls_pass_quiz,start_practice,"Start","Instructions")
}

function fail_quiz(num_previous_tries){
	log_data({"event_type": "fail quiz", "event_info" : {"number_of_previous_tries" : num_previous_tries}})
	if(num_previous_tries==3){
		finish_experiment()
	}
	else{
		show_instructions(0,instructions_text_fail_quiz,instructions_urls_fail_quiz,function(){
			do_quiz(num_previous_tries+1)
		},"Next","Instructions")
	}
}

function do_quiz(num_previous_tries){
	log_data({"event_type": "start quiz", "event_info" : {"number_of_previous_tries" : num_previous_tries}})
	$('.overlayed').show();
	$('#attention_quiz').show();
	if($('#attention_quiz p').length==0){
		for(var i=0;i<quiz_content.length;i++){
			quiz_question = $("<p />").text(quiz_content[i]["question"])
			quiz_answers = $("<select></select>").css({"width" : "50vw"}).append("<option>Choose your answer</option")
			question_order = []
			for(var j =0; j<quiz_content[i]["answers"].length; j++){
				question_order.push(j);
			}
			question_order = shuffle(question_order)
			for(var k=0;k<question_order.length;k++){
				var j = question_order[k]
				answer = quiz_content[i]["answers"][j]
				is_correct = (answer==quiz_content[i]["correct_answer"])
				quiz_answers.append($("<option></option>").text(answer).val(is_correct))
				log_data({"event_type": "quiz question", "event_info" : {"question_number" : i, "answer_number" : k, "question" : quiz_content[i]["question"], "answer" : answer, "is_correct" : is_correct}})
			}
			$('#attention_quiz button').before(quiz_question).before(
				$("<div />").css({"text-align" :"left"}).append(quiz_answers)
			)
		}
	}
	$('#attention_quiz button').off("click").on("click",function(){
		$('#attention_quiz').hide();
		correct = true
		$('#attention_quiz select').each(function(){
			correct = correct && $(this).val()=="true"
			log_data({"event_type": "submit quiz answer", "event_info" : {"selected answer" : $(this).children("option").filter(":selected").text(), "correct" : correct}})
		})
	if(correct){
			pass_quiz(num_previous_tries)
		}
		else{
			fail_quiz(num_previous_tries)
		}
	})
}

function show_instructions(i,texts,urls,callback,start_text,instructions_text,verbose=true){
	if(verbose){
		log_data({"event_type": "show instructions", "event_info" : {"screen_number": i, "instructions_text" : texts[i], "instructions_url" : urls[i] + ".png"}})
	}
	$('.overlayed').show();
	$('#instructions').show();
	$('#instructions p').remove();
	$('#instructions h4').text(instructions_text)
	$('#instructions h4').after("<p>" + texts[i] + "</p>");
	if(urls[i]==""){
		$('#instructions img').hide()
	}
	else{
		$('#instructions img').show().attr("src",get_image_path(urls[i] + ".png"));
	}
	if(i==0){
		$('#previousbutton').hide()
	}
	else {
		$('#previousbutton').show().off("click").on("click",function(){
			show_instructions(i-1,texts,urls,callback,start_text,instructions_text);
		});
	}
	if(i == texts.length - 1 || i == urls.length - 1){
		$('#nextbutton').text(start_text)
		$('#nextbutton').off("click").on("click",function(){
			$('#instructions').hide();
			$('.overlayed').hide();
			callback();
		})
	}
	else {
		$('#nextbutton').text("Next")
		$('#nextbutton').off("click").on("click",function(){
			show_instructions(i+1,texts,urls,callback,start_text,instructions_text);
		});
	}
}

function create_random_string(){
	random_string = ""
	for(var i=0;i<4;i++)
		random_string += Math.floor(10*Math.random()).toString()
	return random_string
}

function create_parent_strings(inherited_advice){
	parent_strings = []
	for(var i=0;i<inherited_advice.length;i++){
		if(informed_selection){
			parent_strings.push("  received bonus: $" + inherited_advice[i]["bonus"].toFixed(2))			
		}
		else{
			do{
				parent_string = "  participant ID: #" + create_random_string()
			} while(parent_strings.includes(parent_string))
			parent_strings.push(parent_string)
		}
	}
	log_data({"event_type": "create parent strings", "event_info" : {"inherited_advice" : inherited_advice.slice(), "parent_strings" : parent_strings.slice()}})
}

function initialize_task(n_imgs,n_main,n_practice,condition_string,advice,callback){
	num_imgs = n_imgs
	num_main_trials = n_main
	num_practice_trials = n_practice
	log_data({"event_type": "parse condition string", "event_info" : {"condition_string": condition_string}})
	informed_selection_dict = {'US': false, 'IS' : true}
	informed_selection = informed_selection_dict[condition_string.split(':')[0]]
	advice_mode = 'both'
	selection_mode = 'multiple-selection'
	max_selections = 3
	log_data({"event_type": "parse condition string", "event_info" : {"condition_string": condition_string, "informed_selection": informed_selection, "advice_mode" : advice_mode, "selection_mode" : selection_mode}})
	inherited_advice = shuffle(advice.slice())
	create_parent_strings(inherited_advice)
	for(var i=0;i<inherited_advice.length;i++){
		inherited_advice[i]["replay_data"]["sequence"] = remove_same_img_clicks(inherited_advice[i]["replay_data"]["sequence"])
	}

	instructions_text_pass_quiz = ["Thank you! You answered all questions correctly.",
								   "The experiment will have 4 phases: practice, learning, bonus, and demonstration.",
								   "You will now start the practice phase. In this phase, you will complete " + num_practice_trials + " practice trials."]
	instructions_urls_pass_quiz = ["",
								   "",
								   ""]
	instructions_text_fail_quiz = ["You answered at least one question incorrectly. Here is a short review of the instructions.",
								   "Every image has a number.",
								   "The numbers are randomly assigned on every trial. They are not related to the content of the images.",
								   "To change the ordering, you can click on any pair of images.",
								   "If the pair you select is out of order, they will swap positions.",
								   "If the pair you select is out of order, they will swap positions.",
								   "You will earn a bonus for every trial you get correct.",
								   "The fewer comparisons you use to put the images in order, the larger your bonus will be.",
								   "Please answer the three questions again to start."]
	instructions_urls_fail_quiz = ["",
								   "instructions-out-of-order",
								   "instructions-out-of-order",
								   "instructions-select-nonadjacent",
								   "instructions-out-of-order",
								   "instructions-select-nonadjacent-swapped",
								   "instructions-in-order",
								   "instructions-in-order-few-swaps",
								   ""]

	instructions_text = ["On each trial, you will see a set of images like this.",
						 "Every image has a number.",
						 "The numbers are randomly assigned on every trial. They are not related to the content of the images.",
						 "But you will not see the numbers.",
						 "Your task is to put the images in the correct order.",
						 "To change the ordering, you can click on any pair of images.",
						 "If the pair you select is out of order, they will swap positions.",
						 "This pair is out of order",
						 "Because the train is number 6 and the eagle is number 1",
						 "So they will swap position",
						 "So they will swap position",
						 "You can make as many such comparisons as you wish.",
						 "When you think all of the images are in order, click Finished.",
						 "You will earn a bonus for every trial you get correct.",
						 "The fewer comparisons you use to put the images in order, the larger your bonus will be.",
						 "Remember, the content of the images is not important.",
						 "The hidden ordering is not related to what is in the images.",
						 "To do this task well, you must ignore the content of the images!",
						 "Before starting the task, please answer three questions to make sure you understand the instructions."
						 ]

	instructions_urls = ["instructions-array",
						 "instructions-out-of-order",
						 "instructions-out-of-order",
						 "instructions-array",
						 "instructions-in-order",
						 "instructions-select-nonadjacent",
						 "instructions-select-nonadjacent",
						 "instructions-select-nonadjacent",
						 "instructions-out-of-order",
						 "instructions-select-nonadjacent",
						 "instructions-select-nonadjacent-swapped",
						 "instructions-select-nonadjacent-swapped",
						 "instructions-click-finished",
						 "instructions-in-order",
						 "instructions-in-order-few-swaps",
						 "",
						 "",
						 "",
						 ""
						 ]
						 
	instructions_text_after_practice = ["You have completed the practice phase. You will now begin the learning phase.",
										""]
	instructions_urls_after_practice = ["",
										""]
										


	if(inherited_advice[0]["replay_data"]["sequence"]==undefined){
		instructions_text_after_advice = ["You will now begin the bonus phase (" + num_main_trials + " trials).",
										  "You will receive an additional bonus for every trial you get correct!"]
		instructions_urls_after_advice = ["",
										  ""]
	}
	else if (inherited_advice.length==1){
		instructions_text_after_advice = ["You will now begin the bonus phase (" + num_main_trials + " trials).",
										  "You will receive an additional bonus for every trial you get correct!",
										  "Can you improve on the previous participant's strategy?"]
		instructions_urls_after_advice = ["",
										  "",
										  ""]
	}
	else {
		instructions_text_after_advice = ["You will now begin the bonus phase (" + num_main_trials + " trials).",
										  "You will receive an additional bonus for every trial you get correct!",
										  "Can you improve on the strategies you've seen?"]
		instructions_urls_after_advice = ["",
										  "",
										  ""]
	}
	
	instructions_text_before_demonstration = ["Please now demonstrate your strategy on the following images."]
	instructions_urls_before_demonstration = [""]
	
	instructions_text_after_main = ["You will now begin the demonstration phase. In this phase, you can earn an additional bonus."]
	instructions_urls_after_main = [""]

	instructions_urls_before_guiding = [""]
	
	instructions_text_during_guiding = ["Now try to recreate the sequence of comparisons you just saw. If you deviate from the sequence, we will highlight the image you should select in green."]
	instructions_urls_during_guiding = [""]
	
	
	receive_advice_text = "The previous participant gave the following strategy advice:"
	enter_advice_text = "Please try to describe the strategy you used, and how well it worked. Your description may be given to another participant. You will receive an additional bonus if your advice helps somebody perform well. Remember, future participants will not see the advice you viewed, only the advice you give here."
	show_practice_scores_text = "Here is a summary of the practice trials"
	show_main_scores_text = "Here is a summary of the bonus phase."
	if(informed_selection){
		select_advice_text_initial = "Please select who you would like to learn from, by clicking on their icon. Next to each participant's icon, you can see the bonus they earned."
	}
	else{
		select_advice_text_initial = "Please select who you would like to learn from, by clicking on their icon. Next to each participant's icon, you can see their participant ID."			
	}
	if(advice_mode == "text" || inherited_advice[0]["replay_data"]["sequence"]==undefined){
		select_advice_text_additional = "You can view the same advice again, or select other participants' advice to view. You can view advice from up to three different participants in total. Whenever you are ready, you can click Start to move on to the bonus phase."
		instructions_text_after_practice[instructions_text_after_practice.length-1] = "In this phase, you will learn from previous participants who completed the task, by viewing advice they wrote. This will help you earn a larger bonus."
	}
	else if(advice_mode == "replay"){
		select_advice_text_additional = "You can observe the same strategy again, or select other participants' strategy to observe. You can observe strategies from up to three different participants in total. Whenever you are ready, you can click Start to move on to the bonus phase."
		instructions_text_after_practice[instructions_text_after_practice.length-1] = "In this phase, you will learn from previous participants who completed the task, by observing their strategy and trying to recreate it. This will help you earn a larger bonus."
		instructions_text_before_guiding = ["You will try out an example of this participant's strategy in action. The participant will guide you through which comparisons to make, by highlighting the next image to click on in green."]
	}
	else if(advice_mode == "both"){
		select_advice_text_additional = "You can view the same advice again, or select other participants' advice to view. You can view advice from up to three different participants in total. Whenever you are ready, you can click Start to move on to the bonus phase."
		instructions_text_after_practice[instructions_text_after_practice.length-1] = "In this phase, you will learn from previous participants who completed the task, by viewing advice they wrote, observing their strategy and trying to recreate it. This will help you earn a larger bonus."
		instructions_text_before_guiding = ["You will now try out an example of this strategy in action. The participant will guide you through which comparisons to make, by highlighting the next image to click on in green."]
	}
	else{
		console.log("unknown advice mode:",advice_mode)
	}
	quiz_content = [{
			"question" : "How is the order of the images determined?",
			"answers" : ["The numbers are randomly assigned on every trial",
						 "Images of animals have high numbers, other images are lower",
						 "Images that look beautiful have higher numbers"
			],
			"correct_answer" : "The numbers are randomly assigned on every trial"
		},{
			"question" : "When do two images swap?",
			"answers" : ["When I click on them",
						 "When I click on them and they are out of order",
						 "Never"
			],
			"correct_answer" : "When I click on them and they are out of order"
		},{
			"question" : "How is your bonus calculated?",
			"answers" : ["My bonus is larger if I correctly put the images in order with as few comparisons as I can",
						 "My bonus is randomly assigned on every trial",
						 "I always get the same bonus when the images are in order"
			],
			"correct_answer" : "My bonus is larger if I correctly put the images in order with as few comparisons as I can"
		}
	]
	preload_images()
	callback()
}

function preload_img(imgs_to_preload, i){
	if(i<imgs_to_preload.length){
		if(imgs_to_preload[i]==""){
			preload_img(imgs_to_preload, i + 1);
		}
		else{
			image_array[i]=new Image();
			img = imgs_to_preload[i]
			if(img.startsWith("instructions")){
				img=img + ".png"
			}
			image_array[i].onload=function(){
				$("<img />").attr("src",get_image_path(img)).appendTo("#preload_images");
				preload_img(imgs_to_preload, i + 1);
			}
			image_array[i].src=get_image_path(img);
		}
	}
	else{
		log_data({"event_type": "preloading complete", "event_info" : {}})
	}
}

function preload_images(){
	log_data({"event_type": "preloading images", "event_info" : {}})
	shuffled_imgs = shuffle(imgs.slice())
	imgs_to_preload = [].concat.apply([],[instructions_urls,instructions_urls_fail_quiz,instructions_urls_pass_quiz,instructions_urls_after_practice,instructions_urls_after_advice,instructions_urls_before_demonstration,shuffled_imgs])
	image_array = new Array(imgs_to_preload.length)
	preload_img(imgs_to_preload,0)
}

function start_experiment(){
	$(document).on("contextmenu",function(e){
		e.preventDefault()
	})
	// show_instructions(0,instructions_text,instructions_urls,function(){
	//  	do_quiz(0)
	// },"Next","Instructions");
	$('.overlayed').hide();
	do_trial(0);
}