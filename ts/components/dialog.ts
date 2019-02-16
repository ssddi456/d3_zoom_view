import * as ko from 'knockout';



export const editDialog = {
    isShow: ko.observable(false),
    __editContent: ko.observable(''),
    callback: <unknown>undefined as (str: string | null) => any,
    show(content: string, done: (str: string | null) => any) {
        this.__editContent(content || '');
        this.callback = done;
        this.isShow(true);
    },
    hide() {
        this.isShow(false);
    },
    cancel() {
        this.callback && this.callback(null);
        this.hide();
    },
    confirm() {
        this.callback(ko.unwrap(this.__editContent));
        this.hide();
    }
};

ko.components.register('edit_dialog', {

    viewModel: {
        instance: editDialog
    },
    template: /* template */`
<div class="modal-backdrop fade" data-bind="css: { 'in': isShow},  style: { display: isShow() ? 'block': 'none' }"></div>
<div class="modal fade" tabindex="-1" role="dialog" data-bind="css: { 'in': isShow },  style: { display: isShow() ? 'block': 'none' }">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close"  aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" >Edit content</h4>
      </div>
      <div class="modal-body">
        <textarea class="form-control" data-bind="value: __editContent"></textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-bind="click: cancel">Close</button>
        <button type="button" class="btn btn-primary" data-bind="click: confirm">Save changes</button>
      </div>
    </div>
  </div>
</div>
`
});