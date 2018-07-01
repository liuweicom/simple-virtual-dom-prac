var _={};
_.type = function abc(obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '')
  }
  
  _.isArray = function isArray (list) {
    return _.type(list) === 'Array'
  }
  
  _.slice = function slice (arrayLike, index) {
    return Array.prototype.slice.call(arrayLike, index)
  }
  
  _.truthy = function truthy (value) {
    return !!value
  }
  
  _.isString = function isString (list) {
    return _.type(list) === 'String'
  }
  
  _.each = function each (array, fn) {
      if(array){
        for (var i = 0, len = array.length; i < len; i++) {
            fn(array[i], i);
          }
      }
  }
  
  _.toArray = function toArray (listLike) {
    if (!listLike) {
      return []
    }
  
    var list = []
  
    for (var i = 0, len = listLike.length; i < len; i++) {
      list.push(listLike[i])
    }
  
    return list
  }
  
  _.setAttr = function setAttr (node, key, value) {
    switch (key) {
      case 'style':
        node.style.cssText = value
        break
      case 'value':
        var tagName = node.tagName || ''
        tagName = tagName.toLowerCase()
        if (
          tagName === 'input' || tagName === 'textarea'
        ) {
          node.value = value
        } else {
          // if it is not a input or textarea, use `setAttribute` to set
          node.setAttribute(key, value)
        }
        break
      default:
        node.setAttribute(key, value)
        break
    }
  }

  /**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @return {Object} - {moves: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 */
function list_diff (oldList, newList, key) {
    var oldMap = makeKeyIndexAndFree(oldList, key)
    var newMap = makeKeyIndexAndFree(newList, key)
  
    var newFree = newMap.free
  
    var oldKeyIndex = oldMap.keyIndex
    var newKeyIndex = newMap.keyIndex
  
    var moves = []
  
    // a simulate list to manipulate
    var children = []
    var i = 0
    var item
    var itemKey
    var freeIndex = 0
  
    // first pass to check item in old list: if it's removed or not
    while (i < oldList.length) {
      item = oldList[i]
      itemKey = getItemKey(item, key)
      if (itemKey) {
        if (!newKeyIndex.hasOwnProperty(itemKey)) {
          children.push(null)
        } else {
          var newItemIndex = newKeyIndex[itemKey]
          children.push(newList[newItemIndex])
        }
      } else {
        var freeItem = newFree[freeIndex++]
        children.push(freeItem || null)
      }
      i++
    }
  
    // children 在老队列中，每一个元素，与新队列进行对比，删除的元素赋值为null，
    //这样使的diffChildren中，如果moves已经比较出子类的顺序问题时，不会在子类比较时，再次被记录到patches中避免了重复步骤,原本这一点一直困惑我！！！惊喜
    var simulateList = children.slice(0)
  
    // remove items no longer exist
    i = 0
    while (i < simulateList.length) {
      if (simulateList[i] === null) {
        remove(i)
        removeSimulate(i)
      } else {
        i++
      }
    }
  
    // i is cursor pointing to a item in new list
    // j is cursor pointing to a item in simulateList
    var j = i = 0
    while (i < newList.length) {
      item = newList[i]
      itemKey = getItemKey(item, key)
  
      var simulateItem = simulateList[j]
      var simulateItemKey = getItemKey(simulateItem, key)
  
      if (simulateItem) {
        if (itemKey === simulateItemKey) {
          j++
        } else {
          // new item, just inesrt it
          if (!oldKeyIndex.hasOwnProperty(itemKey)) {
            insert(i, item)
          } else {
            // if remove current simulateItem make item in right place
            // then just remove it
            var nextItemKey = getItemKey(simulateList[j + 1], key)
            if (nextItemKey === itemKey) {
              remove(i)
              removeSimulate(j)
              j++ // after removing, current j is right, just jump to next one
            } else {
              // else insert item
              insert(i, item)
            }
          }
        }
      } else {
        insert(i, item)
      }
  
      i++
    }
  
    //if j is not remove to the end, remove all the rest item
    var k = simulateList.length - j
    while (j++ < simulateList.length) {
      k--
      remove(k + i)
    }
  
  
    function remove (index) {
      var move = {index: index, type: 0}
      moves.push(move)
    }
  
    function insert (index, item) {
      var move = {index: index, item: item, type: 1}
      moves.push(move)
    }
  
    function removeSimulate (index) {
      simulateList.splice(index, 1)
    }
  
    return {
      moves: moves,
      children: children
    }
  }
  
  /**
   * Convert list to key-item keyIndex object.
   * @param {Array} list
   * @param {String|Function} key
   */
  function makeKeyIndexAndFree (list, key) {
    var keyIndex = [];
    var free = []
    if(list && _.isArray(list)){
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i]
            var itemKey = getItemKey(item, key)
            if (itemKey) {
              keyIndex[itemKey] = i
            } else {
              free.push(item)
            }
          }
    }
    return {
      keyIndex: keyIndex,
      free: free
    }
  }
  
  function getItemKey (item, key) {
    if (!item || !key) return void 666
    return typeof key === 'string'
      ? item[key]
      : key(item)
  }
  
  function Element(tagName,props,children){
    if(!(this instanceof Element)){
        if(!_.isArray(children) && children!=null){
            children=_.slice(arguments,2).filter(_.truthy);
        }
        return new Element(tagName,props,children);
    }

    if(_.isArray(props)){
        children=props;
        props={};
    }
    this.tagName=tagName || '';
    this.props=props || {};
    this.children=children || [];
    this.key=props && props.key?props.key: "";

    var count=0;
    _.each(this.children,function(child,i){
        if(child instanceof Element){
            count+=child.count;
        }else{
            children[i]=""+child;
        }
        count++;
    });

    this.count=count;
}

Element.prototype.render=function(){
    var el = document.createElement(this.tagName);
    var props = this.props;

    for(var propName in props){
        var propValue=props[propName];
        _.setAttr(el,propName,propValue);
    }
    _.each(this.children,function(child){
        var childEl = (child instanceof Element)?
        child.render():
        document.createTextNode(child);
        el.appendChild(childEl);

    });
    return el;
}


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
            //为了避免动态的节点已经被删除了
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

function diff(oldTree,newTree){
	var index=0;
	var pathes={};//对应的是每一个元素，作出的动作
	dfsWalker(oldTree,newTree,index,pathes);
	return pathes;
}

function diffProps(oldNode, newNode){
	var count=0;
	var oldProps = oldNode.props;
	var newProps = newNode.props;

	var key,value;
	var propsPatches={};

	//发现不同的属性值
	for(key in oldProps){
		value = oldProps[key];
		if(newProps[key] !== value){
			propsPatches[key]=newProps[key];
			count++;
		}
	}

	for(key in newProps){
		value = newProps[key];
		if(!oldProps.hasOwnProperty(key)){
			count++;
			propsPatches[key]=newProps[key];
		}
	}
	if(count === 0){
		return null;
	}

	return propsPatches;
}

function diffChildren(oldChildren, newChildren,index,patches,currentpatch){
	var diffs = list_diff(oldChildren,newChildren,"key");
  newChildren=diffs.children;
	if(diffs.moves.length){
		var reorderPath ={type:patch.REORDER,moves:diffs.moves};
		currentpatch.push(reorderPath);
	}
	var leftNode = null;
	var currentindex=index;
	_.each(oldChildren,function(child,index1){

		var newChild = newChildren[index1];
		currentindex = leftNode && (leftNode.count>0)?
		currentindex+leftNode.count+1:
        currentindex+1;
		dfsWalker(child,newChild,currentindex,patches);
		leftNode=child;
	});
}

function dfsWalker(oldNode,newNode,index,pathes){
	var currentPath=[];

	if(newNode === null){
		// 在patch.REORDER时，存在新的节点为null,避免了节点的删除对dom的浪费再次记录到patches
  		
	}else if(_.isString(oldNode) && _.isString(newNode)){
		if(oldNode === newNode){
      
      // 文本节点被替换的内容，作为递归的出口之一，还有一个出口就是newNode === null,也是一个出口
			currentPath.push({type: patch.TEXT,content: newNode});
		}
	}else if(oldNode.tagName === newNode.tagName && oldNode.key === newNode.key){
		var propsPatches =diffProps(oldNode,newNode);
		if(propsPatches){
			currentPath.push({type: patch.PROPS, props: propsPatches});
		}
		//判断新节点是否有ignore属性，有的话则忽略子节点的更新
		if(!newNode.props || !newNode.props.hasOwnProperty("ignore")){
			diffChildren(oldNode.children, newNode.children,index,pathes,currentPath);
		}

	}else{
		//剩下的这些就是完全不同
		currentPath.push({
			type:patch.REPLACE,node:newNode
		});
	}
	if(currentPath.length){//有必要的，如果不存在会存在很多个为【】的数组压入patches
		pathes[index]=currentPath;
	}
}



var tree=new Element("div",{id:"container"},[
    new Element( "h1",{style: 'color: blue'},["simple virtual dom"]),
    new Element( "p",["hello, virtual-dom"]),
    new Element( "ul",[
      new Element("li",{key:"a"}),
      new Element("li",{key:"b"}),
      new Element("li",{key:"c"})
  ])

   
]);

var root=tree.render();
document.getElementsByTagName("body")[0].appendChild(root);
var newTree =new Element('div', {'id': 'container'}, [
    new Element('h1', {style: 'color: red'}, ['simple virtal dom']),
    new Element('p', ['Hello, virtual-dom']),
    new Element('ul', [
      new Element('li',{key:"a"}), 
      new Element('li',{key:"c"}),
      new Element('li',{key:"d"}),
  ])
])

var patches=diff(tree,newTree);
//
console.log(patches,'patches---------');
console.log(tree,newTree,'tree--------newtree----------');
patch(root,patches);