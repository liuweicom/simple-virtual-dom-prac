var _=require("./util");
var REPLACE=0;
var REORDER=1;
var PROPS=2;
var TEXT=3;

function patch(node,patches){
    var walkers={index:0};
    walker(node,walkers,patches);
}
function reorderChildren(node,moves){
    var staticNodeList=_.toArray(node.childNodes);

    //得到maps对象的键值对
    var maps={};
    _.each(staticNodeList,function(node){
        if(node.nodeType===1){
            var key=node.getAttribute("key");
            if(key){
                maps[key]=node;
            }
        }
    });
  
    _.each(moves,function(move,index){
        var index=move.index;

        if(move.type ===0){
            //为了避免动态的节点已经被删除了,childNodes 是动态的, 添加删除节点会发生改变
            if(staticNodeList[index]===node.childNodes[index]){

                node.removeChild(node.childNodes[index]);
            }
            staticNodeList.splice(index,1);
        }else if(move.type === 1){
            //先判断要插入的元素在原来的列表中是否已经有，如果已经有的话就可以再利用
            var insetNode=maps[move.item.key]?
            maps[move.item.key].cloneNode(true):
            (typeof move.item === 'string'?
            document.createTextNode(move.item):
            move.item.render());
            node.insertBefore(insetNode,node.childNodes[index]|| null);

        }
    });

}
function setProps(node,props){
    for(var prop in props){
        if(props[prop] === void 666){
            node.removeAttribute(key);
        }else{
            var value=props[prop];
            _.setAttr(node,prop,value);
        }
    }
}
function applyPatches(node,currentPatches){
    _.each(currentPatches,function(currentPatch){
        switch(currentPatch.type){
            case REPLACE: 
                (typeof currentPatch.node === 'String')?
                document.createTextNode(currentPatch.node)
                :currentPatch.node.render();
                node.parentNode.replaceChild(newNode,node);
                break;
            case REORDER:
                reorderChildren(node,currentPatch.moves);
                break;
            case PROPS:
                setProps(node,currentPatch.props);
                break;
            case Text:
                if(node.textContent){
                    node.textContent=currentPatch.content;
                }else{
                    node.nodeValue=currentPatch.content;
                }
                break;
            default:
            throw new Error('unkown patch type'+currentPatch.type);
        }
    });
}
function walker(node,walker1,patches){
    var currentPatch=patches[walker1.index];

    var len=node.childNodes?node.childNodes.length:0;
    for(var i=0;i<len;i++){
        var child=node.childNodes[i];
        walker1.index++;
        walker(child,walker1,patches);
    }

    if(currentPatch){
        applyPatches(node,currentPatch);
    }
}

patch.REPLACE=REPLACE;
patch.REORDER=REORDER;
patch.PROPS=PROPS;
patch.TEXT=TEXT;

module.export=patch;