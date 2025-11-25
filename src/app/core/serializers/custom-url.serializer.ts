import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';

export class CustomUrlSerializer extends DefaultUrlSerializer {
    override serialize(tree: UrlTree): string {
        return super.serialize(tree).replace(/%2F/g, '/');
    }
}
