$(document).ready(function(){
/*
 * This cheks chrome storage for saved instances and credentials,
 * shows auth login if not find and requests the instances from AWS.
 */

chrome.storage.sync.get(function(items){
    /*
     * Storage contain key=value vars and should have saved instances.
     * Iterate whole items object and look for keys start with 'instances_'.
     * This will save one-two seconds in module loading.
     */
    var saved_instances = [];
    let z = 0;
    for(var key in items){
        if(key.indexOf('instance_') !== -1){
            saved_instances[z] = {};
            saved_instances[z]['name'] = key.substring('instance_'.length);
            saved_instances[z]['lan_ip'] = items[key];
            z++;
        }
    }
    show_results(saved_instances);

    authorize(items);
});


function authorize(items){
    /*
     * Required parameters are:
     * - accessKeyId
     * - secretAccessKey
     * - region
     * Uncomment line below to see whole extension's storage.
     */
    //console.log(items);
    AWS.config.update({
        accessKeyId: items.access_key,
        secretAccessKey: items.secret
    });
    AWS.config.region = items.region;


    /*
     * Hide login div if authorized.
     * Request all the instances linked to account.
     */
    var ec2 = new AWS.EC2();
    if (ec2){
        $('#auth').hide();
        ec2.describeInstances({}, function(err, data) {
            if (err) console.log(err, err.stack);
            else     get_ip_addrs(data);
        });
    }
};


function get_ip_addrs(data){
    /*
     * Build an array of objects with instances data
     */
    var instances = [];
    data = data.Reservations;
    //console.log(data);
    for(var i=0; i < data.length; i++){
        let to_storage = {}
        instances[i] = {}
        instances[i].lan_ip = data[i].Instances[0].PrivateIpAddress;
        instances[i].wan_ip = data[i].Instances[0].PublicIpAddress;

        for(var y = 0; y < data[i].Instances[0].Tags.length; y++){
            if(data[i].Instances[0].Tags[y].Key == 'Name'){
                instances[i].name = data[i].Instances[0].Tags[y].Value;
            }
        }
        to_storage['instance_'+instances[i].name] = instances[i].lan_ip;
        chrome.storage.sync.set(to_storage);
    }
    show_results(instances);
};


function show_results(instances){
    $('#instances').empty();
    for(var i=0; i < instances.length; i++){
        document.getElementById('instances').innerHTML += '<tr><td>' +
        instances[i].name + '</td><td>' + instances[i].lan_ip +
        '</td><td>' + instances[i].wan_ip + '</td></tr>';
    }
};


$( '#save_credentials' ).click(function() {
    chrome.storage.sync.set({'secret':      $('#secret').val() });
    chrome.storage.sync.set({'access_key':  $('#access_key').val() });
    chrome.storage.sync.set({'region':      $('#region').val() });
    location.reload();
});

$('#clear').click(function(){
    chrome.storage.sync.clear(function(){window.close()});
});
});
