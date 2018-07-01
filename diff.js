var _ = require("./util");
var patch = require("./patch");
var listDiff=require("list_diff");

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