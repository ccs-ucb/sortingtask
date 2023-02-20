// // *** Expertiment Admin ***
var my_node_id, gradient_queries, inheritance, estimatedinheritance, inheritedscore, estimatedinheritancescore
var lockrange = 20.
var d = lockrange / 2.
var round = 0;
var trial = 0;
var basewidth = 100;
var length = 100;
var arrowboxwidth = 150;
var arrowbowheight = 150;
var touchedbasewidth = false;
var touchedlength = false;
var showsubmit = true;
var maxdiff = 40;

/* ---- Utility Functions ---- */

getMostRecentInfo = function(infos){
    var mri = infos.reduce(function(l, e) {
        return e.id > l.id ? e : l;
    });
    return mri
}

postStimulus = function (packet, callback) {
    spinner = dallinger.BusyForm()
    spinner.freeze([])

    dallinger.createInfo(my_node_id, packet)
    
    .done(function (resp) {
        spinner.unfreeze();
        callback()
    })
    .fail(function (err) {
        spinner.unfreeze();  
        dallinger.allowExit();        
        nextpage = '/questionnaire?participant_id=' + dallinger.identity.participantId + '&worker_id=' + dallinger.getUrlParameter('worker_id') +'&hit_id=' + dallinger.getUrlParameter('hit_id') +'&assignment_id=' + dallinger.getUrlParameter('assignment_id') +'&mode=' + dallinger.getUrlParameter("mode") + '&recruiter=mturk';        
        window.location = nextpage
    })
}

randomStimulus = function() {
    var design = {"Base Width": 50 + Math.floor(Math.random() * 100), "Length": 50 + Math.floor(Math.random() * 100)}
    basewidth = design["Base Width"]
    length = design["Length"]
    return design
}

designDiff = function (produced, observed) {
    lengthdiff = Math.abs(produced['Length'] - observed['Length'])
    bwdiff = Math.abs(produced['Base Width'] - observed['Base Width'])
    return lengthdiff + bwdiff
};

writeText = function (message, x, y, size = 10) {
    var text = new paper.PointText(new paper.Point(x, y));
    text.justification = 'center';
    text.fillColor = 'black';
    text.content = message;
    text.fontSize = size
    return text
}

nextBox = function (rightpush, trialindex){
    var trialpos = trialindex + (rightpush)
    var maxboxsize = 75.
    var ypush = maxboxsize / 2.
    var screenwidthprop = .8
    var margin_left = (paper.view.bounds.width * (1 - screenwidthprop)) / 2. 
    var viewwidth = paper.view.bounds.width * screenwidthprop
    var nboxes = parseFloat(rounds[2].trials + 1)
    var boxwidth = Math.min((viewwidth / nboxes), maxboxsize)
    var boxheight = boxwidth
    var y = (boxheight / 2.) + ypush
    var x = (margin_left + (((viewwidth / nboxes)) * (trialpos + rightpush))) - ((viewwidth / nboxes) / 2.)
    return {x:x, y:y, w:boxwidth, h:boxheight}
}

blockSliders = function () {
    $(".js-range-slider[name=basewidthslider]").data("ionRangeSlider").update({block: true});
    $(".js-range-slider[name=lengthslider]").data("ionRangeSlider").update({block: true});
}

unblockSliders = function () {
    $(".js-range-slider[name=basewidthslider]").data("ionRangeSlider").update({block: false});
    $(".js-range-slider[name=lengthslider]").data("ionRangeSlider").update({block: false});
}

fadeIcons = function (r) {
    paper.project.activeLayer.children["inherited"].opacity = .25
    for (i = 0; i < r; i++) {
        paper.project.activeLayer.children["icon" + i].opacity = .25
    }
}

fillIcons = function (r) {
    paper.project.activeLayer.children["inherited"].opacity = 1.
    for (i = 0; i <= r; i++) {
        paper.project.activeLayer.children["icon" + i].opacity = 1.
    }
}

getInheritedScore = function () {
    return inheritedscore
}

initExp = function () {
    dallinger.preventExit = true;
    canvas = new paper.PaperScope();
    canvas.setup(document.getElementById('paperjscanvas'));
    $("#canvas-div").hide()
    $("#sliders-div").hide()
    $("#spinner").hide()
    $("#shoot-button").hide()

    // ping dallinger: create a new node
    dallinger.createAgent()

        // if this has worked, grab:
        .done(function (resp) {
            // node id
            my_node_id = resp.node.id;
            
            // experimental variables
            dallinger.getExperimentProperty('gradient_queries')
                .done(function (propertiesResp) {gradient_queries = propertiesResp.gradient_queries})

            // arrowhead designed by my parent
            dallinger.getReceivedInfos(my_node_id)
                .done(function (inheritedInfos) {

                    var inherited = getMostRecentInfo(inheritedInfos.infos)

                    // parsed into json
                    inheritance = JSON.parse(inherited.contents)

                    // and its score
                    inheritedscore = inherited.property1
                    
                    // and invoke the first trial
                    nextInstruction();

                })
        })
        
        .fail(function (rejection) {
          // A 403 is our signal that it's time to go to the questionnaire
          if (rejection.status === 403) {
            dallinger.allowExit();
            dallinger.goToPage('questionnaire');
          
          } else {
            dallinger.error(rejection);
          }
        });
}

// Practic Reproduction trial
trialTypePR = function() {

    p = randomStimulus();

    f = function () {
        var cross = fixationCross();

        setTimeout(function() {

            paper.project.activeLayer.children["fixationcross"].remove()

            tech = drawStimulus(p, paper.view.center.x, paper.view.center.y, 150, 150);

            setTimeout(function(){ 

                paper.project.activeLayer.children["maintech"].remove()

                if (trial == 0){
                    drawSliders();
                }
                else {
                    updateSliders();
                }

            }, 3000)
        }, 1500)
    }

    packet = makePacket(parametrisation = p, info_type = "randomtechnology")

    
    
    postStimulus(packet, callback = f)
}

// Inheritance Reproduction trial
trialTypeIR = function() {

    var cross = fixationCross();

    setTimeout(function() {

        paper.project.activeLayer.children["fixationcross"].remove()

        tech = drawStimulus(inheritance, paper.view.center.x, paper.view.center.y, 150, 150);

        setTimeout(function(){ 

            paper.project.activeLayer.children["maintech"].remove()

            updateSliders();

        }, 3000)

    }, 1500)
}


// Gradient trial
trialTypeG = function(info = null) {
    showsubmit = false;

    if (info == null) {
        var info = estimatedinheritance
    }

    else {
        var info = JSON.parse(info.contents)
    }

    $("#shoot-button").fadeTo(25, 1);

    $("#sliders-button").fadeTo(5, 0);

    if (trial == 0) {
        drawIcon(rightpush = 0, parametrisation = estimatedinheritance , name = "inherited", score = estimatedinheritancescore , trialindex = trial + 1, roundindex = round)

        $("#shoot-button").click(function (){
            var release = false;
            startAnimation(paper.project.activeLayer.children["maintech"])
            return false
        })
    }

    updateSliders(parametrisation = estimatedinheritance, limit = true); 

    var tech = drawStimulus(estimatedinheritance, paper.view.center.x, paper.view.center.y, arrowboxwidth, arrowbowheight, name = "maintech");

    $("#sliders-button").hide()
}

// Production trial
trialTypeP = function(parametrisation = null) {
    showsubmit = true;
    
    // $("#shoot-button").fadeTo(25, 0);
    $("#shoot-button").hide();

    updateSliders(parametrisation = estimatedinheritance, limit = true);

    $("#sliders-button").fadeTo(25, 1)

    $("#sliders-button").removeClass("btn-primary");

    $("#sliders-button").addClass("btn-success");

    $("#sliders-button").html("Go Hunting: Submit Your Arrowhead")

    var tech = drawStimulus(estimatedinheritance, paper.view.center.x, paper.view.center.y, arrowboxwidth, arrowbowheight, name = "maintech");

}

// Finish trial
finalFeedback = function(info) {
    // ping dallinger -- or recieve as args
    dallinger.preventExit = false;

    $("#instructions-header").html("Virtual Hunt Complete")
    $("#instructions-text").html("Your arrowhead scored: " + Math.round(info.property1 * 100) / 100 + " calories.")

    $("#instructions-button").fadeTo(25, 0);
    $("#instructions-previous").fadeTo(25, 0);

    $("#instructions-div").show()

    $("#finish-button").attr('style', 'visibility:visible')
    $("#finish-button").click(function () {
        nextpage = '/questionnaire?participant_id=' + dallinger.identity.participantId + '&worker_id=' + dallinger.getUrlParameter('worker_id') + '&hit_id=' + dallinger.getUrlParameter('hit_id') + '&assignment_id=' + dallinger.getUrlParameter('assignment_id') + '&mode=' + dallinger.getUrlParameter("mode") + '&recruiter=mturk';
        window.location = nextpage
    })


}

previousInstruction = function () {
    
    trial -= 2;
    nextInstruction();
}

nextInstruction = function (info) {
    $("#instructions-button").html("Next &raquo;")
    
    $("#instructions-div").show();
    
    $("#instructions-header").html("Round " + (round + 1))

    $("#instructions-button").attr("style", "visibility:visbile")

    // add previous button when availible
    if (trial > 0) {
        $("#instructions-previous").attr("style", "visibility:visbile")
        $("#instructions-previous").fadeTo(10, 1)
    }

    else {
        $("#instructions-previous").fadeTo(10, 0)

    }


    if (round < 4) {
        if ((trial < rounds[round].instructions.length)) {
            $("#instructions-text").html(rounds[round].instructions[trial])
            trial += 1
        }

        else if (trial > rounds[round].instructions.length){
            $("#instructions-div").hide()
            trial = 0;
            nextTrial()
            } 
        
        else {
            $("#instructions-text").html("To begin the round, click Begin.")
            $("#instructions-button").html("Begin")
            trial += 1
            }
        }
    else {
        finalFeedback(info)
    }
    return false
}

stopAnimation = function (arrow){
    // this func takes over from record trial for code expediency
    paper.view.onFrame = function (event) {}
    
    $("#shoot-button").fadeTo(25, 0);

    arrow.remove()

    blockSliders();

    // note: f gets called after save data has executed
    // saveData updates trial and round info, so here we have to accommodate that
    var f = function (info) {

        if ((trial == 0) & round > 0) {
            t = rounds[round - 1].trials - 1
            r = round - 1
        }

        else {
            t = trial - 1;
            r = round
        }

        fadeIcons(t)

        var feedback = writeText(message = "The arrowhead you tested earned " + Math.round(info.property1 * 100) / 100 + " calories.", paper.view.center.x, paper.view.center.y, size = 18)

        var icon = drawIcon(rightpush = 1, parametrisation = JSON.parse(info.contents), name = "icon" + t, score = info.property1, trialindex = t, roundindex = r);

        setTimeout(function () {
        
            feedback.remove()

            unblockSliders();

            fillIcons(t);

            $("#shoot-button").fadeTo(25, 1);
            
            if (t + 1 < rounds[r].trials) {
                nextTrial(info = info);
                return false
            }
            else {
                $("#shoot-button").fadeTo(25, 0);
                $("#sliders-div").hide()
                nextInstruction()
                return false
            }

        }, 3000)

    }

    saveData(f);
}

startAnimation = function (arrow) {
    $("#shoot-button").fadeTo(25, 0);
    arrow.rotate(-90)
    var release = false;
    paper.view.onFrame = function (event) {
        if (release == false) {
            if (arrow.position.x > (paper.view.center.x * .75)) {
                arrow.position.x -= (((arrow.position.x - (paper.view.center.x * .75)) / 10.) + 2)
            }
            else {
                release = true;
            }
        }
        else {
            if (arrow.position.x - arrow.bounds.width < paper.view.size.width) {
                arrow.position.x += ((paper.view.size.width - arrow.position.x) / 5.) + 35
            }
            else {
                stopAnimation(arrow)
            }
        }
    }

}

annotateStimulus = function (parent, parametrisation, x, y, w, h, name, score, tiralindex, roundindex) {

    undertext = writeText(message = + Math.round(score * 100) / 100 + ' Cal.', x = x, y = y + (h / 2) + 10, size = 12)
    
    if (name == "inherited"){
        var overtextcontent = 'You Inherited';
    }
    else {
        var overtextcontent = 'Test ' + (trialindex + 1) +  ' of ' + (rounds[roundindex].trials);   
    }
    
    overtext = writeText(message = overtextcontent, x = x, y = y - (h + 20), size = 12)

    parent.addChild(overtext)
    parent.addChild(undertext)
}

drawIcon = function (rightpush = 1, parametrisation = {'Length':85, 'Base Width':85}, name = "", score, trialindex, roundindex) {
    var box = nextBox(rightpush, trialindex);
    var x = box.x 
    var y = box.y
    var w = box.w
    var h = box.h
    parent = drawStimulus(parametrisation = parametrisation, x = x, y = y, w = w, h = h, name = name)
    annotateStimulus(parent = parent, parametrisation, x = x, y = y, w = w, h = h, name = name, score = score, trialindex, roundindex)
}


var rounds = {}

rounds[0] = {
    name: "practicereproduction",
    trials: 1,
    trialFunc: trialTypePR,
    info_type: 'practicetechnology',
    instructions: ["This is a practice round.",
                   "On each trial, you will briefly see an arrowhead.",
                   "After it dissappears, your task is to recreate it.",
                   "Two sliders will appear at the bottom of the screen.",
                   "Use these to recreate the arrowhead as accurately as possible."],
    onFinish: function() {} // currently unused but can be called by recordTrial or saveData for extra functionality 
    }

rounds[1] = {
    name: "inheritancereproduction",
    trials: 1,
    trialFunc: trialTypeIR,
    info_type: 'reproducedtechnology',
    instructions: ["Practice trials are over.",
                   "The arrowheads you observed before were random designs.",
                   "The arrowhead you will see next is not random.",
                   "It was designed by another participant who finished this game.",
                   "You have inherited this player's arrowhead.",
                   "You will observe it briefly.", 
                   "Then you will have an opportunity to recreate it.",
                   "Please try to recreate it as accurately as you can."],
    onFinish: function() {
        estimatedinheritance = {'Base Width': basewidth, 'Length':length}
        if (designDiff(estimatedinheritance, inheritance) > maxdiff) {
            dallinger.allowExit();
            nextpage = '/questionnaire?participant_id=' + dallinger.identity.participantId + '&worker_id=' + dallinger.getUrlParameter('worker_id') +'&hit_id=' + dallinger.getUrlParameter('hit_id') +'&assignment_id=' + dallinger.getUrlParameter('assignment_id') +'&mode=' + dallinger.getUrlParameter("mode") + '&recruiter=mturk';
            window.location = nextpage
        }
    }
}

rounds[2] = {
    name: "gradient",
    trials: 4,
    trialFunc: trialTypeG,
    info_type: 'testedtechnology',
    instructions: ["In this round, you can modify your arrowhead.",
                    "You will have the opportunity to test alternative designs.",
                   "Your goal is to try to improve the arrowhead's score.",
                   "You can use the sliders to change its design.",
                   "But the designs you can make may be restricted.",
                   "Click Shoot to see how many calories an arrowhead earns."],
    onFinish: function() {}
    }

rounds[3] = {
    name: "production",
    trials: 1,
    trialFunc: trialTypeP,
    info_type: 'producedtechnology',
    instructions: ["This is the final round.",
                    "The arrowhead you design now will determine your bonus.",
                    "The more calories it earns, the larger your bonus will be.",
                    "Design your arrowhead carefully, and click Submit when you are ready."],
    onFinish: function() {
        }
    }

makePacket = function (parametrisation = null, info_type = null) {

    if (parametrisation == null) {
        var parametrisation = {"Base Width": basewidth, "Length": length}
    }
    
    if (info_type == null) {
        var info_type = rounds[round].info_type
    }

    var data = {contents: JSON.stringify(parametrisation), info_type: info_type}

    return data
}

saveData = function (callback, data) {
    spinner = dallinger.BusyForm()
    spinner.freeze([])

    var packet = makePacket()

    // ping dallinger: add my updates to the db!
    dallinger.createInfo(my_node_id, packet)

    // loop into another trial or leave
    .done(function (resp) {
        spinner.unfreeze();

        if (trial + 1 < rounds[round].trials) {
            trial += 1;
        } 
        else {
            trial = 0;
            round += 1;
        }

        if (resp.info.type == 'reproducedtechnology') estimatedinheritancescore = resp.info.property1;
        
        callback(resp.info);
    })

    .fail(function (err) {
        spinner.unfreeze();
        
        dallinger.allowExit();
        
        nextpage = '/questionnaire?participant_id=' + dallinger.identity.participantId + '&worker_id=' + dallinger.getUrlParameter('worker_id') +'&hit_id=' + dallinger.getUrlParameter('hit_id') +'&assignment_id=' + dallinger.getUrlParameter('assignment_id') +'&mode=' + dallinger.getUrlParameter("mode") + '&recruiter=mturk';
        
        window.location = nextpage
    })
}

recordTrial = function (info = null) {
    $("#sliders-div").hide()
    
    touchedbasewidth = false;
    touchedlength = false;

    paper.project.activeLayer.removeChildren()

    var proceed = writeText(message = "Trial complete. Loading...", x = paper.view.center.x, y = paper.view.center.y, size = 18)

    setTimeout(function () {
        proceed.remove()
        
        if (trial + 1 >= rounds[round].trials) {
            rounds[round].onFinish()
            saveData(nextInstruction)

        } 
       
        else {
            saveData(nextTrial)
        }
    }, 1200)

}

nextTrial = function (info = null) {
    f = rounds[round]["trialFunc"];
    if (info != null){
        f(info);
    }
    else {
        f()
    }
}

var drawStimulus = function (parametrisation, x, y, w, h, name = "maintech") {
    // (x,y) = center point
    // (h,w) = box hieght & width
    if ((name == "maintech") & ("maintech" in paper.project.activeLayer.children)){
        paper.project.activeLayer.children["maintech"].remove()
        
    }
    var max_length = 150. // 50 - 150
    var max_width = 150. 
    var min_length = 50.;
    var min_width = 50;
    
    var halfHeight = ((parametrisation['Length'] / max_length) * h ) / 2
    var halfWidth = ((75./ max_width) * w) / 2. // 75 = fixed param
    var halfPoint = ((parametrisation['Base Width'] / max_width) * w) / 2

    // bind elements into a paperjs Group
    var tech = new paper.Group();

    // draw arrowhead
    var arrowhead = new paper.Path()
    arrowhead.add(new paper.Point(x, y + halfHeight));
    arrowhead.add(new paper.Point(x - halfWidth, y))
    arrowhead.add(new paper.Point(x - halfPoint, y - (halfHeight * .75)))
    arrowhead.add(new paper.Point(x, y - halfHeight))
    arrowhead.add(new paper.Point(x + halfPoint, y - (halfHeight * .75)))
    arrowhead.add(new paper.Point(x + halfWidth, y))
    arrowhead.closed = true;
    arrowhead.fillColor = '#44413d';

    // draw stem
    var arrow = new paper.Path();
    arrow.add(new paper.Point(x, y - halfHeight));
    arrow.add(new paper.Point(x, y - (halfHeight + (h / 10.))));
    arrow.strokeWidth = 5; 
    arrow.strokeColor = '#754a04' 

    tech.addChild(arrowhead);
    tech.addChild(arrow);
    tech.name = name
    return tech
    
};

drawSliders = function (parametrisation = null, limits = null) {

    if (Math.random() < 0.99) {
        console.log("SWITCH!")
        $(".js-range-slider[name=basewidthslider]").attr('name', 'lengthslider_tmp')
        $(".js-range-slider[name=lengthslider]").attr('name', 'basewidthslider')
        $(".js-range-slider[name=lengthslider_tmp]").attr('name', 'lengthslider')

    }
    
    // show the sliders, hide the submit btton
    $("#sliders-div").attr("style", "visibility:visbile")
    $("#sliders-div").show();
    $("#sliders-button").hide();
    
    // reset the record of which sliders have been modified
    touchedbasewidth = false;
    touchedlength = false;

    if (parametrisation == null){
        // fix the fact that this posts to the db too
        parametrisation = randomStimulus();
    }

    if (limits == null) {
        limits = {"Base Width":{"from_min":50, "from_max":150},
                  "Length": {"from_min":50, "from_max":150
                  }}
    }

    length = parametrisation["Length"]
    basewidth = parametrisation["Base Width"]

    $(".js-range-slider[name=basewidthslider]").ionRangeSlider({
        type: "single",
        min: 50,
        max: 150,
        from: parametrisation['Base Width'],
        grid: true,
        from_min: limits["Base Width"].from_min, 
        from_max: limits["Base Width"].from_max,      
        from_shadow: true,   
        hide_min_max: true,
        onChange: function (data) {
            touchedbasewidth = true;
            if (touchedlength & touchedbasewidth & showsubmit){
                $("#sliders-button").attr("style", "visibility:visbile")
                $("#sliders-button").show()
            }
            
            basewidth = data.from
            drawStimulus({'Length': length, 'Base Width': basewidth},
                        paper.view.center.x,
                        paper.view.center.y,
                        arrowboxwidth,
                        arrowbowheight,
                        name = "maintech");
        }
    });

    $(".js-range-slider[name=lengthslider]").ionRangeSlider({
        type: "single",
        min: 50,
        max: 150,
        from: parametrisation['Length'],
        grid: true,
        from_min: limits["Length"].from_min, 
        from_max: limits["Length"].from_max,
        from_shadow: true,   // highlight restriction for FROM handle
        hide_min_max: true,
        onChange: function (data) {
            touchedlength = true;
            if (touchedlength & touchedbasewidth & showsubmit){
                $("#sliders-button").attr("style", "visibility:visbile")
                $("#sliders-button").show()
            }

            length = data.from
            drawStimulus({'Length': length, 'Base Width': basewidth},
                        paper.view.center.x,
                        paper.view.center.y,
                        arrowboxwidth,
                        arrowbowheight,
                        name = "maintech");
        }
    });
}

updateSliders = function (parametrisation = null, limit = false) {
    
    // show the sliders, hide the submit btton
    $("#sliders-div").show();
    $("#sliders-button").hide();
    
    // reset the record of which sliders have been modified
    touchedbasewidth = false;
    touchedlength = false;

    if (parametrisation == null){
        parametrisation = randomStimulus();
    }

    if (limit == false) {
        limits = {"Base Width":{"from_min":50, "from_max":150},
                  "Length": {"from_min":50, "from_max":150
                  }}
    }
    else {
        limits = {"Base Width":{"from_min":estimatedinheritance["Base Width"] - d, "from_max":estimatedinheritance["Base Width"] + d},
                  "Length": {"from_min":estimatedinheritance["Length"] - d, "from_max":estimatedinheritance["Length"] + d
                  }}

    }

    length = parametrisation["Length"]
    basewidth = parametrisation["Base Width"]

    

    $(".js-range-slider[name=basewidthslider]").data("ionRangeSlider").update({
        type: "single",
        min: 50,
        max: 150,
        from: parametrisation['Base Width'],
        grid: true,
        from_min: limits["Base Width"].from_min, 
        from_max: limits["Base Width"].from_max,      
        from_shadow: true,   
        hide_min_max: true
    });

    $(".js-range-slider[name=lengthslider]").data("ionRangeSlider").update({
        type: "single",
        min: 50,
        max: 150,
        from: parametrisation['Length'],
        grid: true,
        from_min: limits["Length"].from_min, 
        from_max: limits["Length"].from_max,
        from_shadow: true,   // highlight restriction for FROM handle
        hide_min_max: true
    });
}

fixationCross = function () {
    $("#canvas-div").show()
    var fixationcross = new paper.Group();
    fixationcross.name = "fixationcross"
    
    var d = 20.
    
    var vertical = new paper.Path();
    vertical.strokeColor = 'black';
    vertical.strokeWidth = 2.;
    vertical.add(new paper.Point(paper.view.center.x, paper.view.center.y - (d/2)));
    vertical.add(new paper.Point(paper.view.center.x, paper.view.center.y + (d/2)));
    fixationcross.addChild(vertical)

    var horizontal = new paper.Path();
    horizontal.strokeWidth = 2.;
    horizontal.strokeColor = 'black';
    horizontal.add(new paper.Point(paper.view.center.x - (d/2), paper.view.center.y));
    horizontal.add(new paper.Point(paper.view.center.x + (d/2), paper.view.center.y));
    fixationcross.addChild(horizontal)

    return fixationcross
}