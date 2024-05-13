import { Core } from "suneditor/src/lib/core";

export const ReferenceTool: any = {
  name: 'reference',
  display: 'command',//('container' || 'command' || 'submenu' || 'dialog'),
  title: 'Reference',
  innerHTML: '<svg fill="#000000" width="100px" height="100px" viewBox="0 0 19 19" xmlns="http://www.w3.org/2000/svg" transform="rotate(0)matrix(1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.04"></g><g id="SVGRepo_iconCarrier"><path d="M6 4H5a1 1 0 1 1 0-2h11V1a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V5a1 1 0 0 0-1-1h-7v8l-2-2-2 2V4z"></path></g></svg>',
  // The class of the button. - default: "se-btn"
  // "se-code-view-enabled": It is not disable when on code view mode.
  // "se-resizing-enabled": It is not disable when on using resizing module.
  buttonClass: '',
  util: null,
  context: null,
  // @Required
  add: function(core, targetElement) {
    const context = core.context;
        context.customCommand_2 = {
          targetButton: targetElement
      };
      // How to set language when setting button properties of plugin directly in plugin
      const titleList = {
          en: 'Reference'
      }
      this.title = titleList[core.lang.code] || 'Reference'
  },

  active: function (element) {
    if (!element) {
        this.util.removeClass(this.context.customCommand_2.targetButton, 'active');
    } else if (/^mark$/i.test(element.nodeName) && element.style.backgroundColor.length > 0) {
        this.util.addClass(this.context.customCommand_2.targetButton, 'active');
        return true;
    }

    return false;
  },

  action: function () {
    if (!this.util.hasClass(this.context.customCommand_2.targetButton, 'active')) {
        const newNode = this.util.createElement('MARK');
        newNode.style.backgroundColor = 'hsl(60,75%,60%)';
        this.nodeChange(newNode, ['background-color'], null, null);
    } else {
      this.nodeChange(null, ['background-color'], ['mark'], true);
    }
  }


};

export const getReferenceTool = function(service): any{
  return {
    service: service,
    name: 'reference',
    display: 'dialog',//('container' || 'command' || 'submenu' || 'dialog'),
    title: 'Reference',
    innerHTML: '<svg fill="#000000" width="100px" height="100px" viewBox="0 0 19 19" xmlns="http://www.w3.org/2000/svg" transform="rotate(0)matrix(1, 0, 0, 1, 0, 0)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.04"></g><g id="SVGRepo_iconCarrier"><path d="M6 4H5a1 1 0 1 1 0-2h11V1a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V5a1 1 0 0 0-1-1h-7v8l-2-2-2 2V4z"></path></g></svg>',
    // The class of the button. - default: "se-btn"
    // "se-code-view-enabled": It is not disable when on code view mode.
    // "se-resizing-enabled": It is not disable when on using resizing module.
    buttonClass: '',
    util: null,
    context: null,
    // @Required
    add: function(core: Core, targetElement: HTMLElement) {
      const context = core.context;
      context.reference = {
        targetButton: targetElement,
        service: service,
      }
      // How to set language when setting button properties of plugin directly in plugin
      const titleList = {
          en: 'Reference'
      }
      this.title = titleList[core.lang.code] || 'Reference'
    },
  
    active: function (element) {
      if (!element) {
        this.util.removeClass(this.context.reference.targetButton, 'active');
      } else if (/^span$/i.test(element.nodeName) && element.attributes['de-reference']) {
        this.util.addClass(this.context.reference.targetButton, 'active');
        return true;
      }
  
      return false;
    },
  
    action: function () {
      if (!this.util.hasClass(this.context.reference.targetButton, 'active')) {
        const newNode = this.util.createElement('span');
        newNode.style.textDecoration = 'underline dashed orange 2px';
        newNode.style.cursor = 'pointer';
        this.nodeChange(newNode, ['text-decoration'], null, null);
      } else {
        this.nodeChange(null, ['text-decoration'], ['mark'], true);
      }
    },

    open: function(){
      if(this.context.reference.targetButton.classList.contains('active')){
        this.nodeChange(null, ['text-decoration', 'cursor'], ['span'], true);
        return;
      }
      this.context.reference.service.openSelectReference(this);
    },

    apply: function(core: Core, path: string){      
      const newNode = core.util.createElement('SPAN') as HTMLElement;
      newNode.setAttribute('de-reference', path);
      newNode.style.textDecoration = 'underline dashed orange 2px';
      newNode.style.cursor = 'pointer';
      newNode.addEventListener('click', (e) => this.service.openReference$.next(e))
      core.nodeChange(newNode, ['text-decoration', 'cursor'], undefined, undefined);
    },

    remove: function () {
      this.nodeChange(null, ['text-decoration', 'cursor'], ['span'], true);
    },
  } ;

  
}