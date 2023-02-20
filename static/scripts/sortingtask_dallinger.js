var dallinger_ignore = ["hover"]
var dallinger_save_at_end = ["mouseup","mousedown", "show instructions"]
var my_node_id

function get_image_path(filename){
	return "static/images/" + filename;
}

function finish_experiment(){
	show_instructions(0,["Please wait while we save your data. This should not take longer than around 30 seconds. If you see this message for longer than 30 seconds, please return the HIT and contact us for compensation."],[""],function(){
		dallinger.submitAssignment()

	},"Finish","Finished")
	$("#nextbutton").hide()

	dallinger.createInfo(my_node_id, {contents: JSON.stringify({"event_time" : Date.now(), "event_type": "final save", "event_info" : {"data_log" : data_log, "included_event_types" : dallinger_save_at_end, "ignored_event_types" : dallinger_ignore}}), info_type: "event"})

	.done(function () {
		$("#instructions p").text("Thank you. Your data was saved successfully. Please click Finish to complete the experiment.")
		$("#nextbutton").show()
	})
	.fail(function (rejection) {
	  // A 403 is our signal that it's time to go to the questionnaire
	  if (rejection.status === 403) {
		dallinger.allowExit();
		dallinger.goToPage('questionnaire');
	  } else {
		dallinger.error(rejection);
	  }
  })
}

var dallinger_inherited_advice = []

// dallinger_inherited_advice = [{bonus:10; advice: "string of instructions"}, {bonus:10; advice: "string of instructions"}]

initExp = function () {

	$("#nextbutton").hide()
	
	show_instructions(0,["Please wait for the experiment to load. This should not take longer than around 30 seconds. If you see this message for longer than 30 seconds, please return the HIT."],[""],start_experiment,"Next","Instructions");
	var n_main_trials, n_practice_trials_nonumbers, n_imgs = 6
	

	// ping dallinger: register this participant
	dallinger.createParticipant()
	
	.done(function (participantResponse){
		// ping dallinger: create a new node
		dallinger.createAgent()

		// if this has worked, grab:
		.done(function (nodeResponse) {
			// console.log(nodeResponse)
			my_node_id = nodeResponse.node.id; // id of the node for the participant

			condition_string = nodeResponse.node.property5.replace(/\'/g, "")
			generation = nodeResponse.node.property2.replace(/\'/g, "")
			network_id = nodeResponse.node.network_id			
			
			
			dallinger.getExperimentProperty('num_trials') // experimental variables
			.done(function (propertiesResp) {
				n_main_trials = propertiesResp.num_trials
				dallinger.getExperimentProperty('num_practice_trials_nonumbers') // experimental variables
				
				.done(function (propertiesResp) {
					n_practice_trials_nonumbers = propertiesResp.num_practice_trials_nonumbers
					dallinger.getReceivedInfos(my_node_id)
					
					.done(function (inheritedInfos) {
						if(nodeResponse.node.type=="particle"){
							formatInheritance(infos = inheritedInfos.infos,callback = function(){
								initialize_task(n_imgs,n_main_trials, n_practice_trials_nonumbers, condition_string, dallinger_inherited_advice, function(){
									$("#instructions p").text("Loading complete. Thanks for your patience. Please click next to begin the experiment.")
									//$("#instructions p").text("my_node_id: " + my_node_id.toString() + ", condition: " + condition_string.toString() + ", generation: " + generation.toString() + ", network_id: " + network_id.toString())
									setTimeout(function(){
										$("#nextbutton").show()
									},500)
								})
							})
						}
						else{
							console.log("unknown node type",nodeResponse.node.type)
						}
					})
				})
			})
			
			// any information transmitted from previous subjects
			
		})
		// if node creation failed, exit	
		.fail(function (rejection) {
			  if (rejection.status === 403) {dallinger.goToPage('questionnaire')}
			  else {dallinger.error(rejection)}
		});
	})

	// if participant creation failed, exit
	.fail(function (rejection) {
		if (rejection.status === 403) {dallinger.goToPage('questionnaire')}
		else {dallinger.error(rejection)}
	})
}

function formatSeedInheritance(infos, callback) {

	var compiled_advice = JSON.parse(infos[0].contents)

	var teachers = Object.keys(compiled_advice)
	for (var i = 0, len = teachers.length; i < len; i++) {
		var source_key = teachers[i]
		var advice_str, img_urls, rank, swaps, bonus, sourceId
		var source_data = {}
		var source_seq_data = {}
		source_seq_data["img_urls"] = compiled_advice[source_key].event_info.replay_data.img_urls
		source_seq_data["rank"] = compiled_advice[source_key].event_info.replay_data.rank
	  	source_seq_data["sequence"] = compiled_advice[source_key].event_info.replay_data.sequence
		source_data["parent_id"] = compiled_advice[source_key].event_info.sourceId
		source_data["bonus"] = compiled_advice[source_key].event_info.bonus
		source_data["advice_text"] = compiled_advice[source_key].event_info.advice
		source_data["replay_data"] = source_seq_data
		dallinger_inherited_advice.push(source_data)
		if(dallinger_inherited_advice.length == Object.keys(compiled_advice).length){
			callback()
		}
	}
}

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
	(rv[x[key]] = rv[x[key]] || []).push(x);
	return rv;
  }, {});
};

var formatInheritance = function (infos,callback) {
	if (infos[0].property1 == 'seedadvicesource') {
		formatSeedInheritance(infos, callback)
	} else {
		// group inherited infos by origin node id
		// use node ids to lookup participant ids
		// use participant ids to lookup bonus payments
		var groubedByNodeId = groupBy(infos, 'origin_id')
		Object.keys(groubedByNodeId).forEach(function(nodeId){
			dallinger.get("/node/" + nodeId + "/getnode/")
				.done(function (nodeResponse) {
					getBonus(infos = groubedByNodeId[nodeId], parent_id = nodeResponse.participant_id, function(){
						if(dallinger_inherited_advice.length == Object.keys(groubedByNodeId).length){
							callback()
						}
					})
				})
		}); 
	}
}

getBonus = function (infos, parent_id, callback) {
	// lookup the bonus this participant recieved
	// pass infos and bonus through to formatOneParent
	var bonus
	if (infos[0].property1 == 'advicesource') {
		bonus = -1
		formatOneParent(infos = infos, bonus = bonus, parent_id = -1, callback = callback)
	}
	else if (infos[0].property1 == 'seedadvicesource') {
		bonus = 2.5
		formatOneParent(infos = infos, bonus = bonus, parent_id = parent_id, callback = callback)
	}

	else {
		dallinger.get("/getbonus/" + parent_id)
			.done(function(participantResponse) {
				bonus = parseFloat(participantResponse.bonus)
				formatOneParent(infos = infos, bonus = bonus, parent_id = parent_id, callback = callback)
			})
	}
}

formatOneParent = function (infos, bonus, recieved_parent_id, callback) {
	// should only be one advice info per parent
	// advice info type should be "advicesource" for generation = 1 and "submit_advice" thereafter 
	var advice = Object.values(infos).filter(obj => {return (obj.property1 === "submit advice" || obj.property1 === "advicesource" || obj.property1 === "seedadvicesource")})
	advice_str = JSON.parse(advice[0].contents).advice

	// parent_id defaults to -1, which is the conventional id of a non-participant "Source"
	var swaps, shuffle, rank, img_urls, parent_id = -1

	if (infos[0].property1 == 'seedadvicesource') {
		img_urls = JSON.parse(advice[0].contents).replay_data.img_urls
		rank = JSON.parse(advice[0].contents).replay_data.rank
		swaps = JSON.parse(advice[0].contents).replay_data.sequence
	}

	// Check the participant is not in generation 1
	// If they are, infos will be length 1 and contain only the source-node-created info
	if ((infos[0].property1 != 'advicesource') && (infos[0].property1 != 'seedadvicesource')) {

		// over-ride default -1 parent_id
		parent_id = recieved_parent_id
		
		// find all infos for swaps and sort by front-end creation time (property2)
		var swaps = Object.values(infos).filter(obj => {return obj.property1 === "swap"})
		swaps.sort((a, b) => parseFloat(a.property2) - parseFloat(b.property2));
		swaps = swaps.map(a => JSON.parse(a.contents));
		// console.log('inside formatoneparent, swaps: ', swaps)

		// find the shuffle info to obtain rank and imgs
		// should only be onf shuffle info
		shuffle = Object.values(infos).filter(obj => {return obj.property1 === "shuffle"})
		rank = JSON.parse(shuffle[0].contents).rank
		img_urls = JSON.parse(shuffle[0].contents).img_urls

	}

	dallinger_inherited_advice.push({"parent_id": parent_id, "bonus": bonus, "advice_text": advice_str, "replay_data" : {"img_urls" : img_urls, "rank" : rank, "sequence" : swaps}})
	callback()
}
			  
function log_data(data){
	data["event_time"] = Date.now()
	if (!dallinger_ignore.includes(data.event_type) && !dallinger_save_at_end.includes(data.event_type)) {

		data.event_type == "submit advice" ? info_type = "advice" : info_type = "event"

		dallinger.createInfo(my_node_id, {contents: JSON.stringify(data), info_type: info_type})
			.fail(function (rejection) {
			  // A 403 is our signal that it's time to go to the questionnaire
			  if (rejection.status === 403) {
				dallinger.allowExit();
				dallinger.goToPage('questionnaire');
			  } else {
				dallinger.error(rejection);
			  }
		  })
	}
	else if(!dallinger_ignore.includes(data.event_type)){
		data_log.push(data)
	}
}