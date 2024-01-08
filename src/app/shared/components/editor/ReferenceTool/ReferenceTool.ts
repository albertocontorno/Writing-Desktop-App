import { API, InlineToolConstructorOptions } from "@editorjs/editorjs";
import { ProjectService } from "../../../services/project.service";
import { InlineTool } from '@editorjs/editorjs'
export class ReferenceTool implements InlineTool{
  name: string;
  button: HTMLButtonElement;
  api: API;
  tag: string ='SPAN';
  class: string = 'ed-reference';
  service: ProjectService;
  
  static get isInline() {
    return true;
  }

  _state: boolean;
  get state() {
    return this._state;
  }
  set state(state) {
    this._state = state;
    this.button.classList.toggle(this.api.styles.inlineToolButtonActive, state);
  }

  static get sanitize() {
    return {
        span: {
          class: true,
          attribute: true,
          'ed-data-context': true,
          role: true,
          tabindex: true
        }
    };
  }

  constructor({ config, api }: InlineToolConstructorOptions) {
    console.log('REFERENCE TOOL')
    this.api = api;
    this._state = false;
    this.service = config.getService();
    this.service.referenceSelected$.subscribe( reference => {
      console.log('reference selected -> wrap', reference);
      this.wrap(this.service.currentReferenceRange, reference);
      this.service.currentReferenceRange = undefined;
    });
  }
  
  prepare(data: { toolName: string; config: any; }): void | Promise<void> {
    this.name = data.toolName;
  }

  reset(): void | Promise<void> {

  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.innerHTML = '<svg width="20" height="18"><path d="M10.458 12.04l2.919 1.686-.781 1.417-.984-.03-.974 1.687H8.674l1.49-2.583-.508-.775.802-1.401zm.546-.952l3.624-6.327a1.597 1.597 0 0 1 2.182-.59 1.632 1.632 0 0 1 .615 2.201l-3.519 6.391-2.902-1.675zm-7.73 3.467h3.465a1.123 1.123 0 1 1 0 2.247H3.273a1.123 1.123 0 1 1 0-2.247z"/></svg>';
    this.button.classList.add(this.api.styles.inlineToolButton);

    return this.button;
  }

  surround(range) {
    if (this.state) {
      this.unwrap(range);
      return;
    }
    console.log('SELECT REFERENCE')
    this.service.openSelectReference(range);
  }

  wrap(range, reference) {
    if(!range){return;}
    const selectedText = range.extractContents();
    const ref: HTMLElement = document.createElement(this.tag);
    ref.classList.add(this.class);
    ref.setAttribute('href', '');
    ref.setAttribute('role', 'button');
    ref.setAttribute('tabindex', '0');
    ref.setAttribute('ed-data-context', reference.path);
    ref.addEventListener('click', (e) => this.service.openReference$.next(e));

    ref.appendChild(selectedText);
    range.insertNode(ref);

    this.api.selection.expandToTag(ref);
  }

  unwrap(range) {
    const mark = this.api.selection.findParentTag(this.tag, this.class);
    const text = range.extractContents();

    mark!.remove();

    range.insertNode(text);
  }



  checkState() {
    const mark = this.api.selection.findParentTag(this.tag);

    this.state = !!mark;

    /* if (this.state) {
      this.showActions(mark);
    } else {
      this.hideActions();
    } */
    return this.state;
  }

  public destroy(): void {
    console.log('destroy')
  }
}